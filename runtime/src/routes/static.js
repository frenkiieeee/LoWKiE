"use strict";
const fs = require("fs/promises");
const path = require("path");
const config = require("../config/config");
const session = require("../security/session");

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".md": "text/markdown; charset=utf-8" };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

async function serve(req, res, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (e) { return notFound(res); }
  if (pathname === "/") pathname = "/index.html";
  const rel = pathname.replace(/^\/+/, "");
  if (rel.includes("\0") || rel.split(/[\\/]/).includes("..")) return notFound(res);
  const top = rel.split("/")[0];
  if (!config.STATIC_ALLOW.includes(top)) return notFound(res);   // runtime/, docs/, .git… nunca se sirven
  const abs = path.join(config.ROOT, rel);
  if (!abs.startsWith(config.ROOT + path.sep)) return notFound(res);
  try {
    let data = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    if (rel === "index.html") {
      // El token de sesión solo llega a la página servida por este servicio.
      data = Buffer.from(data.toString("utf8").replace("</head>", `  <meta name="lowkie-token" content="${session.token}">\n</head>`));
    }
    res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Length": data.length,
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": CSP, "Referrer-Policy": "no-referrer" });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (e) { notFound(res); }
}
function notFound(res) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("No encontrado"); }
module.exports = { serve };
