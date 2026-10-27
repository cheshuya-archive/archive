(() => {
  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUv;
    attribute vec2 aSleeve;
    uniform float uAngle;
    varying vec2 vUv;
    varying vec2 vSleeve;
    varying vec3 vNormal;
    void main() {
      float c = cos(uAngle);
      float s = sin(uAngle);
      vec3 p = vec3(c * aPosition.x + s * aPosition.z,
                    aPosition.y,
                    -s * aPosition.x + c * aPosition.z);
      vNormal = normalize(vec3(c * aNormal.x + s * aNormal.z,
                               aNormal.y,
                               -s * aNormal.x + c * aNormal.z));
      vUv = aUv;
      vSleeve = aSleeve;
      float perspective = 2.7 / (2.7 - p.z);
      gl_Position = vec4(p.x * 1.85 * perspective,
                         p.y * 1.85 * perspective,
                         -0.18 * p.z, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform sampler2D uTexture;
    uniform vec3 uFabric;
    uniform bool uIsSide;
    uniform bool uIsInterior;
    uniform bool uIsRim;
    varying vec2 vUv;
    varying vec2 vSleeve;
    varying vec3 vNormal;
    void main() {
      vec3 light = normalize(vec3(-0.35, 0.55, 0.85));
      float diffuse = max(dot(normalize(vNormal), light), 0.0);
      if (uIsInterior) {
        gl_FragColor = vec4(uFabric * 0.10, 1.0);
      } else if (uIsRim) {
        gl_FragColor = vec4(uFabric * (0.51 + 0.22 * diffuse), 1.0);
      } else if (uIsSide) {
        if (dot(vSleeve, vSleeve) < 1.0) discard;
        gl_FragColor = vec4(uFabric * (0.76 + 0.34 * diffuse), 1.0);
      } else {
        float mask = texture2D(uTexture, vUv).a;
        if (mask < 0.52) discard;
        vec4 color = texture2D(uTexture, vUv);
        gl_FragColor = vec4(color.rgb * (0.83 + 0.20 * diffuse), 1.0);
      }
    }
  `;

  const loadImage = source => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });

  const shader = (gl, type, source) => {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(item);
      gl.deleteShader(item);
      throw new Error(message);
    }
    return item;
  };

  const programFor = gl => {
    const vertex = shader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  };

  const textureFor = (gl, image) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  };

  // Build a continuous garment-shaped tube from the product silhouette. The
  // photographed front/back are projected only onto their respective panels;
  // side panels use fabric color, so they do not stretch the print into a slab.
  const geometryFor = image => {
    const resolution = 160;
    const scratch = document.createElement('canvas');
    scratch.width = resolution;
    scratch.height = resolution;
    const context = scratch.getContext('2d', {willReadFrequently: true});
    context.drawImage(image, 0, 0, resolution, resolution);
    const pixels = context.getImageData(0, 0, resolution, resolution).data;
    const occupied = (x, y) => x >= 0 && y >= 0 && x < resolution && y < resolution && pixels[(y * resolution + x) * 4 + 3] > 40;
    const rawBounds = Array.from({length: resolution}, (_, row) => {
      let left = resolution;
      let right = -1;
      for (let col = 0; col < resolution; col++) {
        if (occupied(col, row)) {
          left = Math.min(left, col);
          right = Math.max(right, col);
        }
      }
      return right < 0 ? null : [left / resolution - 0.5, (right + 1) / resolution - 0.5];
    });
    const firstRow = rawBounds.findIndex(Boolean);
    let lastRow = firstRow;
    for (let row = firstRow; row < resolution; row++) {
      if (rawBounds[row]) lastRow = row;
    }
    const rowBounds = rawBounds.map((bounds, row) => {
      if (bounds) return bounds;
      const nearest = Math.max(firstRow, Math.min(lastRow, row));
      return rawBounds[nearest] || rawBounds.find(Boolean);
    });
    const smoothedBounds = rowBounds.map((_, row) => {
      const neighbors = [];
      for (let offset = -6; offset <= 6; offset++) {
        neighbors.push({
          bounds: rowBounds[Math.max(0, Math.min(resolution - 1, row + offset))],
          weight: 7 - Math.abs(offset),
        });
      }
      const totalWeight = neighbors.reduce((sum, item) => sum + item.weight, 0);
      return [0, 1].map(index => neighbors.reduce((sum, item) => sum + item.bounds[index] * item.weight, 0) / totalWeight);
    });
    const sections = [[], [], [], [], []];
    const segmentCount = 120;
    const boundsAt = row => {
      const boundedRow = Math.max(0, Math.min(resolution - 1, row));
      const below = Math.floor(boundedRow);
      const above = Math.min(resolution - 1, below + 1);
      const fraction = boundedRow - below;
      return [0, 1].map(index => smoothedBounds[below][index] * (1 - fraction) + smoothedBounds[above][index] * fraction);
    };
    const point = (row, segment) => {
      const bounds = boundsAt(row);
      const center = (bounds[0] + bounds[1]) / 2;
      const halfWidth = (bounds[1] - bounds[0]) / 2;
      const theta = -Math.PI / 2 + segment * Math.PI * 2 / segmentCount;
      const height = row / resolution;
      const waist = Math.exp(-Math.pow((height - 0.70) / 0.18, 2));
      const hem = Math.max(0, Math.min(1, (height - 0.84) / 0.14));
      const body = Math.max(0, Math.min(1, (height - 0.46) / 0.10));
      const shapedWidth = halfWidth * (1 - body * (0.055 * waist - 0.018 * hem));
      const x = center + body * 0.003 * Math.sin((height - 0.46) * 8) + shapedWidth * Math.sin(theta);
      const y = 0.5 - height + hem * hem * (0.004 * Math.cos(3 * theta + 0.4) + 0.002 * Math.sin(7 * theta));
      const depth = (0.125 + 0.023 * Math.exp(-Math.pow((height - 0.29) / 0.18, 2))
        - 0.010 * waist + 0.010 * hem) * Math.min(1, Math.max(0.75, halfWidth / 0.20));
      const lowerDrape = Math.max(0, Math.min(1, (height - 0.38) / 0.48));
      const shoulderDrape = Math.exp(-Math.pow((height - 0.24) / 0.15, 2));
      const fold = lowerDrape * (0.006 * Math.sin(25 * x + 2.5 * y) + 0.003 * Math.sin(43 * x - 5 * y))
        + shoulderDrape * 0.003 * Math.sin(17 * x + 17 * y);
      return [x + fold * Math.sin(theta), y, (depth + fold) * Math.cos(theta)];
    };
    const vertex = (row, segment) => {
      const position = point(row, segment);
      const across = point(row, segment + 0.15).map((value, index) => value - point(row, segment - 0.15)[index]);
      const down = point(row + 0.15, segment).map((value, index) => value - point(row - 0.15, segment)[index]);
      const normal = [
        down[1] * across[2] - down[2] * across[1],
        down[2] * across[0] - down[0] * across[2],
        down[0] * across[1] - down[1] * across[0],
      ];
      const magnitude = Math.hypot(...normal) || 1;
      const bounds = boundsAt(row);
      const theta = -Math.PI / 2 + segment * Math.PI * 2 / segmentCount;
      const textureX = (bounds[0] + bounds[1]) / 2 + (bounds[1] - bounds[0]) / 2 * Math.sin(theta);
      const sleeveRow = (row / resolution - 0.42) / 0.07;
      const sleeveAngle = Math.cos(theta) / 0.25;
      return [...position, ...normal.map(value => value / magnitude), textureX + 0.5, 1 - row / resolution,
        sleeveRow, sleeveAngle];
    };
    const grid = Array.from({length: lastRow - firstRow + 1}, (_, row) =>
      Array.from({length: segmentCount + 1}, (_, segment) => vertex(row + firstRow, segment)));
    for (let row = firstRow; row < lastRow; row++) {
      for (let segment = 0; segment < segmentCount; segment++) {
        const theta = -Math.PI / 2 + (segment + 0.5) * Math.PI * 2 / segmentCount;
        const face = Math.cos(theta) > 0.42 ? 0 : Math.cos(theta) < -0.42 ? 1 : 2;
        const a = grid[row - firstRow][segment];
        const b = grid[row - firstRow + 1][segment];
        const c = grid[row - firstRow][segment + 1];
        const d = grid[row - firstRow + 1][segment + 1];
        sections[face].push(...a, ...b, ...c, ...c, ...b, ...d);
      }
    }
    // A narrow rolled rim and recessed fabric tunnel give each sleeve its own
    // opening instead of a flat dark oval painted onto the side of the shirt.
    for (const side of [-1, 1]) {
      const centerRow = resolution * 0.42;
      const centerTheta = side === 1 ? Math.PI / 2 : Math.PI * 3 / 2;
      const makeVertex = (position, normal = [side, 0, 0]) =>
        [...position, ...normal, position[0] + 0.5, position[1] + 0.5, 0, 0];
      const ringPoint = (phase, inset, shrink) => {
        const row = centerRow + resolution * 0.07 * Math.sin(phase) * shrink;
        const theta = centerTheta + 0.255 * Math.cos(phase) * shrink;
        const segment = (theta + Math.PI / 2) * segmentCount / (Math.PI * 2);
        const position = point(row, segment);
        position[0] -= side * inset;
        return position;
      };
      const center = point(centerRow, (centerTheta + Math.PI / 2) * segmentCount / (Math.PI * 2));
      center[0] -= side * 0.065;
      const centerVertex = makeVertex(center);
      const ringSegments = 64;
      for (let index = 0; index < ringSegments; index++) {
        const a = index * Math.PI * 2 / ringSegments;
        const b = (index + 1) * Math.PI * 2 / ringSegments;
        const outerA = makeVertex(ringPoint(a, -0.002, 1.015));
        const outerB = makeVertex(ringPoint(b, -0.002, 1.015));
        const lipA = makeVertex(ringPoint(a, 0.018, 0.84));
        const lipB = makeVertex(ringPoint(b, 0.018, 0.84));
        const innerA = makeVertex(ringPoint(a, 0.052, 0.70));
        const innerB = makeVertex(ringPoint(b, 0.052, 0.70));
        sections[4].push(...outerA, ...lipA, ...outerB, ...outerB, ...lipA, ...lipB);
        sections[3].push(...lipA, ...innerA, ...lipB, ...lipB, ...innerA, ...innerB);
        sections[3].push(...centerVertex, ...innerA, ...innerB);
      }
    }
    return sections.map(vertices => new Float32Array(vertices));
  };

  const mount = (slide, {frontSrc, backSrc, color}) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'merch-3d-canvas';
    const gl = canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: false});
    if (!gl) return {setActive() {}, destroy() {}};
    let active = false;
    let destroyed = false;
    let ready = false;
    let frame = 0;
    let angle = 0;
    let previousTime = 0;
    let program;
    let buffers = [];
    let textures = [];
    let observer;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const uniforms = {};
    const attributes = {};
    const draw = () => {
      const width = Math.max(1, Math.round(slide.clientWidth * Math.min(devicePixelRatio || 1, 1.5)));
      const height = Math.max(1, Math.round(slide.clientHeight * Math.min(devicePixelRatio || 1, 1.5)));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uniforms.angle, angle);
      gl.uniform3f(uniforms.fabric, ...(color === 'black' ? [0.065, 0.065, 0.065] : [0.87, 0.87, 0.87]));
      buffers.forEach((mesh, index) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
        gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 40, 0);
        gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 40, 12);
        gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, 40, 24);
        gl.vertexAttribPointer(attributes.sleeve, 2, gl.FLOAT, false, 40, 32);
        gl.uniform1i(uniforms.side, index === 2 ? 1 : 0);
        gl.uniform1i(uniforms.interior, index === 3 ? 1 : 0);
        gl.uniform1i(uniforms.rim, index === 4 ? 1 : 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[index === 1 ? 1 : 0]);
        gl.uniform1i(uniforms.texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      });
    };
    const tick = time => {
      if (!active || destroyed || !ready) return;
      if (previousTime) angle = (angle + Math.min(time - previousTime, 80) * Math.PI * 2 / 24000) % (Math.PI * 2);
      previousTime = time;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const setActive = value => {
      cancelAnimationFrame(frame);
      previousTime = 0;
      active = !destroyed && Boolean(value) && !reducedMotion.matches;
      if (ready && active) frame = requestAnimationFrame(tick);
    };
    const destroy = () => {
      destroyed = true;
      setActive(false);
      observer?.disconnect();
      buffers.forEach(mesh => gl.deleteBuffer(mesh.buffer));
      textures.forEach(texture => gl.deleteTexture(texture));
      if (program) gl.deleteProgram(program);
      canvas.remove();
      slide.classList.remove('merch-3d-ready');
    };
    slide.append(canvas);
    Promise.all([loadImage(frontSrc), loadImage(backSrc)]).then(([frontImage, backImage]) => {
      if (destroyed) return;
      program = programFor(gl);
      gl.useProgram(program);
      attributes.position = gl.getAttribLocation(program, 'aPosition');
      attributes.normal = gl.getAttribLocation(program, 'aNormal');
      attributes.uv = gl.getAttribLocation(program, 'aUv');
      attributes.sleeve = gl.getAttribLocation(program, 'aSleeve');
      [attributes.position, attributes.normal, attributes.uv, attributes.sleeve].forEach(location => gl.enableVertexAttribArray(location));
      uniforms.angle = gl.getUniformLocation(program, 'uAngle');
      uniforms.texture = gl.getUniformLocation(program, 'uTexture');
      uniforms.fabric = gl.getUniformLocation(program, 'uFabric');
      uniforms.side = gl.getUniformLocation(program, 'uIsSide');
      uniforms.interior = gl.getUniformLocation(program, 'uIsInterior');
      uniforms.rim = gl.getUniformLocation(program, 'uIsRim');
      textures = [textureFor(gl, frontImage), textureFor(gl, backImage)];
      buffers = geometryFor(frontImage).map(vertices => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        return {buffer, count: vertices.length / 10};
      });
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      ready = true;
      draw();
      slide.classList.add('merch-3d-ready');
      observer = new ResizeObserver(draw);
      observer.observe(slide);
      if (active) frame = requestAnimationFrame(tick);
    }).catch(error => {
      console.warn('3D shirt preview unavailable; showing product photo.', error);
      destroy();
    });
    return {setActive, destroy};
  };

  window.CheshuyaShirt3D = {mount};
})();
