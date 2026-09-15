import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PUBLIC_FILES = new Set(["index.html", "manifest.json", "sw.js"]);
const PUBLIC_DIRS = ["css", "icons", "js"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export function resolvePublicPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded === "/") decoded = "/index.html";
  const parts = decoded.split("/").filter(Boolean);
  if (!parts.length || parts.includes("..") || parts.some((part) => part.startsWith("."))) return null;
  const relativePath = parts.join("/");
  const isPublic = PUBLIC_FILES.has(relativePath) || PUBLIC_DIRS.includes(parts[0]);
  if (!isPublic) return null;
  const file = resolve(ROOT, relativePath);
  const fromRoot = relative(ROOT, file);
  if (fromRoot.startsWith(`..${sep}`) || fromRoot === "..") return null;
  return file;
}

export function serve(port) {
  return new Promise((resolveServer, reject) => {
    const server = createServer(async (req, res) => {
      const pathname = new URL(req.url, "http://localhost").pathname;
      const file = resolvePublicPath(pathname);
      if (!file) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      try {
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolveServer(server));
  });
}
