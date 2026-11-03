"use strict";
// Uso: node runtime/src/cli.js start | stop
const fs = require("fs");
const http = require("http");
const { LOCK } = require("./server");
const config = require("./config/config");
const { openBrowser } = require("./utils/open-browser");

function readLock() { try { return JSON.parse(fs.readFileSync(LOCK, "utf8")); } catch (e) { return null; } }

function request(port, method, path, token) {
  return new Promise((resolve) => {
    const req = http.request({ host: config.HOST, port, method, path, timeout: 3000,
      headers: Object.assign({ Host: `127.0.0.1:${port}` }, token ? { "X-LoWKie-Token": token } : {}) }, (res) => {
      let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { resolve(null); } });
    });
    req.on("error", () => resolve(null)); req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// Una instancia es de LoWKie solo si /api/health responde con nuestra firma.
async function runningInstance() {
  const lock = readLock();
  if (!lock) return null;
  const r = await request(lock.port, "GET", "/api/health");
  return r && r.body && r.body.ok && r.body.version ? lock : null;
}

async function waitHealthy(port) {
  for (let i = 0; i < 50; i++) { const r = await request(port, "GET", "/api/health"); if (r && r.body && r.body.ok) return true; await new Promise((s) => setTimeout(s, 100)); }
  return false;
}

async function start() {
  const existing = await runningInstance();
  if (existing) {
    const url = `http://127.0.0.1:${existing.port}/`;
    console.log(`LoWKie ya está en marcha: ${url}`);
    if (!process.env.LOWKIE_NO_BROWSER) openBrowser(url);
    return;
  }
  const { start: boot } = require("./server");
  const { port, url } = await boot();
  const java = await require("./services/java-service").detect();
  console.log(`LoWKie ${config.VERSION}\n  Dirección: ${url}\n  Java: ${java.state === "ready" ? java.version : java.message}`);
  if (java.state !== "ready") {
    console.log("\n  Aún no hay Java (JDK 21+). No hace falta que hagas nada ahora:\n  LoWKie te ofrecerá instalarlo con un clic desde su pantalla, la primera vez que quieras programar.");
  }
  console.log("\nDeja esta ventana abierta mientras usas LoWKie. Ciérrala o pulsa Ctrl+C para terminar.");
  if (await waitHealthy(port) && !process.env.LOWKIE_NO_BROWSER) openBrowser(url);   // el navegador se abre cuando el servicio ya responde
}

async function stop() {
  const lock = await runningInstance();
  if (!lock) { console.log("LoWKie no está en ejecución."); try { fs.rmSync(LOCK, { force: true }); } catch (e) { /* nada */ } return; }
  const r = await request(lock.port, "POST", "/api/shutdown", lock.token);
  console.log(r && r.body && r.body.ok ? "LoWKie se ha cerrado." : "No se pudo cerrar LoWKie de forma ordenada.");
}

const cmd = process.argv[2];
if (cmd === "start") start().catch((e) => { console.error("No se pudo iniciar LoWKie:", e.message); process.exit(1); });
else if (cmd === "stop") stop().catch((e) => { console.error(e.message); process.exit(1); });
else { console.log("Uso: node runtime/src/cli.js start|stop"); process.exit(2); }
