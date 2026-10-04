import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function serve(directory, port = 0) {
  const root = path.resolve(directory);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".mp4": "video/mp4",
    ".m4a": "audio/mp4",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".md": "text/plain; charset=utf-8",
  };
  const server = http.createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = path.resolve(
        root,
        "." + (rel === "/" ? "/index.html" : rel),
      );
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end();
      }
      const data = await fs.readFile(file);
      const headers = {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
      };
      let from = 0,
        to = data.length - 1,
        status = 200;
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!range || (!range[1] && !range[2])) {
          res.writeHead(416, { "Content-Range": `bytes */${data.length}` });
          return res.end();
        }
        if (!range[1]) from = Math.max(0, data.length - Number(range[2]));
        else {
          from = Number(range[1]);
          if (range[2]) to = Math.min(to, Number(range[2]));
        }
        if (from > to || from >= data.length) {
          res.writeHead(416, { "Content-Range": `bytes */${data.length}` });
          return res.end();
        }
        status = 206;
        headers["Content-Range"] = `bytes ${from}-${to}/${data.length}`;
      }
      const body = data.subarray(from, to + 1);
      res.writeHead(status, { ...headers, "Content-Length": body.length });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve(server)),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const server = await serve(root, Number(process.env.PORT || 4173));
  console.log(`Open http://127.0.0.1:${server.address().port}`);
}
