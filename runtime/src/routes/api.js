"use strict";
const config = require("../config/config");
const session = require("../security/session");
const workspace = require("../services/workspace-service");
const files = require("../services/file-service");
const java = require("../services/java-service");
const progress = require("../services/progress-service");
const { AppError } = require("../utils/errors");
const { ok, readJson } = require("../utils/http");

// Tabla de rutas: "MÉTODO /ruta" → manejador({ q, body, params }) → datos.
// Ninguna ruta acepta comandos libres: Java solo recibe rutas de archivos validadas.
function buildRoutes(ctx) {
  const root = () => workspace.requireRoot();
  return {
    "GET /api/health": async () => ({ status: "up", version: config.VERSION, java: await java.detect(true) }),
    "GET /api/workspace": async () => ({ workspace: workspace.info() }),
    "POST /api/workspace/open": async () => workspace.open(),
    "POST /api/workspace/default": async () => ({ workspace: await workspace.openDefault() }),
    "GET /api/files": async ({ q }) => ({ entries: await files.list(root(), q.get("path") || "") }),

    "GET /api/file": async ({ q }) => files.read(root(), q.get("path")),
    "POST /api/file": async ({ body }) => files.write(root(), body.path, body.content == null ? "" : body.content,
      { createOnly: !!body.createOnly, expectedMtime: body.expectedMtime, force: !!body.force }),
    "PATCH /api/file": async ({ body }) => { await files.rename(root(), body.path, body.newPath); return {}; },
    "DELETE /api/file": async ({ q }) => { await files.remove(root(), q.get("path")); return {}; },
    "POST /api/folder": async ({ body }) => { await files.mkdir(root(), body.path); return {}; },

    "POST /api/java/install": async () => ({ install: java.installJava() }),
    "GET /api/java/install": async () => ({ install: java.installStatus() }),
    "POST /api/java/compile": async ({ body }) => java.compile(body),
    "POST /api/java/run": async ({ body }) => java.run(body),
    "POST /api/java/stop": async ({ body }) => java.stop(body.runId),
    "GET /api/java/status/:runId": async ({ q, params }) => java.status(params.runId, q.get("after")),

    "GET /api/progress": async () => ({ progress: await progress.get("progress") }),
    "PUT /api/progress": async ({ body }) => ({ progress: await progress.put("progress", body) }),
    "GET /api/settings": async () => ({ settings: await progress.get("settings") }),
    "PUT /api/settings": async ({ body }) => {
      delete body.lastWorkspace;   // lo gestiona el servicio de workspace, no el cliente
      return { settings: await progress.put("settings", body) };
    },
    "POST /api/shutdown": async () => { setImmediate(() => ctx.shutdown()); return {}; }
  };
}

function match(routes, method, pathname) {
  const direct = routes[`${method} ${pathname}`];
  if (direct) return { handler: direct, params: {} };
  const m = /^\/api\/java\/status\/([a-f0-9]{16})$/.exec(pathname);
  if (m && method === "GET") return { handler: routes["GET /api/java/status/:runId"], params: { runId: m[1] } };
  return null;
}

async function handle(req, res, url, ctx, routes) {
  const found = match(routes, req.method, url.pathname);
  if (!found) throw new AppError("NOT_FOUND", "Ruta de API desconocida.", 404);
  if (url.pathname !== "/api/health") session.requireToken(req);   // todo salvo health exige sesión
  const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readJson(req) : {};
  const data = await found.handler({ q: url.searchParams, body, params: found.params });
  ok(res, data);
}

module.exports = { buildRoutes, handle };
