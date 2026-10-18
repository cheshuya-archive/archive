const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(root)) { response.writeHead(403); response.end("Forbidden"); return; }
  fs.readFile(target, (error, data) => {
    const type = types[path.extname(target)] || "application/octet-stream";
    const page = !error && path.extname(target) === ".html"
      ? Buffer.from((() => {
          let html = data.toString();
          if (!html.includes('menu-unified.css')) html = html.replace("</head>", '<link rel="stylesheet" href="menu-unified.css"></head>');
          if (!/src=["']header\.js(?:\?[^"']*)?["']/.test(html)) html = html.replace("</body>", '<script src="header.js"></script></body>');
          return html;
        })())
      : data;
    response.writeHead(error ? 404 : 200, { "Content-Type": type });
    response.end(error ? "Not found" : page);
  });
}).listen(3101, "127.0.0.1");
