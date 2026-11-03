"use strict";
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const config = require("./config/config");
const session = require("./security/session");
const api = require("./routes/api");
const statics = require("./routes/static");
const workspace = require("./services/workspace-service");
const java = require("./services/java-service");
const { fail } = require("./utils/http");
const log = require("./utils/logger");

const LOCK = path.join(config.DATA_DIR, "instance.json");

function listen(server, port, tries) {
  return new Promise((resolve, reject) => {
    server.once("error", (e) => {
      if (e.code === "EADDRINUSE" && tries > 0) resolve(listen(server, port + 1, tries - 1));
      else reject(e);
    });
    server.listen(port, config.HOST, () => resolve(server.address().port));   // solo loopback
  });
}

async function start() {
  let port = 0;
  const ctx = { shutdown: async () => { await java.stopAll(); await fs.rm(LOCK, { force: true }); server.close(); process.exit(0); } };
  const routes = api.buildRoutes(ctx);

  const server = http.createServer(async (req, res) => {
    try {
      session.checkHost(req, port);
      session.checkOrigin(req, port);
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname.startsWith("/api/")) {
        await api.handle(req, res, url, ctx, routes);
      } else if (req.method === "GET" || req.method === "HEAD") {
        await statics.serve(req, res, url);
      } else { res.writeHead(405); res.end(); }
    } catch (e) {
      if (!e.code || e.status >= 500 || !e.status) log.error(`${req.method} ${req.url}`, e);
      if (res.headersSent) return res.end();
      // Sin stack traces ni rutas internas hacia el cliente.
      fail(res, e.status && e.code ? e : { status: 500, code: "INTERNAL_ERROR", message: "Error interno. Revisa el registro de LoWKie." });
    }
  });

  port = await listen(server, config.PREFERRED_PORT, config.PORT_TRIES);
  await fs.mkdir(config.DATA_DIR, { recursive: true });
  await fs.writeFile(LOCK, JSON.stringify({ pid: process.pid, port, token: session.token, startedAt: Date.now() }), { mode: 0o600 });

  try { await workspace.restore(); } catch (e) { log.error("restore workspace", e); }
  process.on("SIGINT", ctx.shutdown);
  process.on("SIGTERM", ctx.shutdown);
  process.on("uncaughtException", (e) => log.error("uncaughtException", e));
  return { port, url: `http://127.0.0.1:${port}/` };
}

module.exports = { start, LOCK };
