"use strict";
// Arranca el servicio real con datos temporales y ejercita la API (requiere JDK 21+ para las pruebas de Java).
const fs = require("fs");
const os = require("os");
const path = require("path");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-it-"));
process.env.LOWKIE_DATA_DIR = path.join(tmp, "data");
process.env.LOWKIE_PROJECTS_DIR = path.join(tmp, "projects");
process.env.LOWKIE_PORT = String(45000 + Math.floor(Math.random() * 1000));

const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const { start } = require("../../runtime/src/server");
const session = require("../../runtime/src/security/session");
const java = require("../../runtime/src/services/java-service");

let port;
function call(method, url, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({ host: "127.0.0.1", port, method, path: url,
      headers: Object.assign({ "X-LoWKie-Token": session.token }, data ? { "Content-Type": "application/json" } : {}, headers) }, (res) => {
      let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => {
        let j = null;
        try { j = b ? JSON.parse(b) : null; } catch (e) { j = b; }   // los estáticos no son JSON
        resolve({ status: res.statusCode, body: j });
      });
    });
    req.on("error", reject); if (data) req.write(data); req.end();
  });
}

test.before(async () => { port = (await start()).port; });
test.after(() => { setTimeout(() => process.exit(0), 300); });

test("health no exige token e informa de si se puede instalar Java", async () => {
  const r = await call("GET", "/api/health", null, { "X-LoWKie-Token": "" });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(typeof r.body.java.canInstall, "boolean");
});
test("el resto de la API exige token", async () => {
  const r = await call("GET", "/api/files?path=", null, { "X-LoWKie-Token": "mal" });
  assert.strictEqual(r.status, 401); assert.strictEqual(r.body.error.code, "SESSION_INVALID");
});
test("rechaza Host ajeno y Origin ajeno", async () => {
  assert.strictEqual((await call("GET", "/api/health", null, { Host: "evil.com" })).status, 403);
  assert.strictEqual((await call("GET", "/api/files?path=", null, { Origin: "http://evil.com" })).status, 403);
});
test("no sirve código del servicio ni documentos", async () => {
  for (const p of ["/runtime/src/server.js", "/docs/architecture.md", "/.git/config", "/package.json"]) {
    assert.strictEqual((await call("GET", p)).status, 404, p);
  }
});
test("el token solo se inyecta en index.html", async () => {
  const html = await new Promise((resolve) => http.get({ host: "127.0.0.1", port, path: "/" }, (res) => { let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => resolve(b)); }));
  assert.ok(html.includes(session.token));
});
test("archivos: crear, leer, conflicto externo, renombrar y borrar", async () => {
  assert.strictEqual((await call("POST", "/api/file", { path: "a/B.txt", content: "hola" })).body.ok, true);
  const r = await call("GET", "/api/file?path=a/B.txt");
  assert.strictEqual(r.body.content, "hola");
  assert.strictEqual((await call("POST", "/api/file", { path: "a/B.txt", content: "x", createOnly: true })).status, 409);
  await new Promise((res) => setTimeout(res, 30));   // supera la resolución de mtime del sistema de archivos
  fs.appendFileSync(path.join(process.env.LOWKIE_PROJECTS_DIR, "Arrays", "a", "B.txt"), "!");   // cambio «externo»
  const c = await call("POST", "/api/file", { path: "a/B.txt", content: "yo", expectedMtime: r.body.mtime });
  assert.strictEqual(c.body.error.code, "FILE_CHANGED_EXTERNALLY");
  assert.strictEqual((await call("PATCH", "/api/file", { path: "a/B.txt", newPath: "a/C.txt" })).body.ok, true);
  assert.strictEqual((await call("DELETE", "/api/file?path=a")).body.ok, true);
  assert.strictEqual((await call("DELETE", "/api/file?path=")).status, 400);   // no se borra la raíz
});
test("la instalación de Java exige sesión y consulta el estado sin descargar nada", async () => {
  assert.strictEqual((await call("POST", "/api/java/install", {}, { "X-LoWKie-Token": "mal" })).status, 401);
  const st = await call("GET", "/api/java/install");
  assert.strictEqual(st.body.install.status, "idle");
});
test("traversal y rutas absolutas se rechazan", async () => {
  assert.strictEqual((await call("GET", "/api/file?path=../../x")).body.error.code, "WORKSPACE_PATH_INVALID");
  assert.strictEqual((await call("GET", "/api/file?path=/etc/passwd")).body.error.code, "WORKSPACE_PATH_INVALID");
});

test("Java: compilar, ejecutar y leer la salida", async (t) => {
  if ((await java.detect()).state !== "ready") return t.skip("No hay JDK compatible");
  assert.strictEqual((await call("POST", "/api/java/run", { file: "src/Main.java" })).body.error.code, "NOT_COMPILED");
  const c = await call("POST", "/api/java/compile", {});
  assert.strictEqual(c.body.success, true);
  const run = await call("POST", "/api/java/run", { file: "src/Main.java" });
  let s;
  for (let i = 0; i < 50; i++) { s = (await call("GET", `/api/java/status/${run.body.runId}?after=0`)).body; if (s.status !== "running") break; await new Promise((r) => setTimeout(r, 100)); }
  assert.strictEqual(s.status, "finished");
  assert.ok(s.chunks.map((x) => x.text).join("").includes("Posición 1: 25"));
});
test("Java: error de compilación con pista, y detener un bucle infinito", async (t) => {
  if ((await java.detect()).state !== "ready") return t.skip("No hay JDK compatible");
  await call("POST", "/api/file", { path: "src/Bad.java", content: "public class Bad { int x = ; }" });
  const bad = await call("POST", "/api/java/compile", {});
  assert.strictEqual(bad.body.success, false); assert.ok(bad.body.diagnostics.length >= 1);
  await call("DELETE", "/api/file?path=src/Bad.java");
  await call("POST", "/api/file", { path: "src/Loop.java", content: "public class Loop { public static void main(String[] a) throws Exception { while (true) Thread.sleep(50); } }" });
  assert.strictEqual((await call("POST", "/api/java/compile", {})).body.success, true);
  const run = await call("POST", "/api/java/run", { file: "src/Loop.java" });
  assert.strictEqual((await call("POST", "/api/java/run", { file: "src/Loop.java" })).body.error.code, "RUN_ACTIVE");
  await call("POST", "/api/java/stop", { runId: run.body.runId });
  await new Promise((r) => setTimeout(r, 400));
  assert.strictEqual((await call("GET", `/api/java/status/${run.body.runId}`)).body.status, "stopped");
});

test("Java: compilar un archivo ignora otros archivos rotos del proyecto", async (t) => {
  if ((await java.detect()).state !== "ready") return t.skip("No hay JDK compatible");
  await call("POST", "/api/file", { path: "ejercicios/Roto.java", content: "public class Roto { esto no compila }" });
  assert.strictEqual((await call("POST", "/api/java/compile", {})).body.success, false);          // todo el proyecto: falla
  const one = await call("POST", "/api/java/compile", { file: "src/Main.java" });                 // solo Main: compila
  assert.strictEqual(one.body.success, true);
  assert.strictEqual((await call("POST", "/api/java/run", { file: "ejercicios/Roto.java" })).body.error.code, "NOT_COMPILED");
  assert.strictEqual((await call("POST", "/api/java/compile", { file: "../fuera.java" })).body.error.code, "WORKSPACE_PATH_INVALID");
  await call("DELETE", "/api/file?path=ejercicios/Roto.java");
});

