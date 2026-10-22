import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const siteRoot = resolve("dist");
const port = Number(process.argv[2] || 3103);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const file = resolve(siteRoot, `.${relative}`);
    if (!file.startsWith(`${siteRoot}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    }).end(body);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500)
      .end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Main site preview: http://127.0.0.1:${port}/`);
});
