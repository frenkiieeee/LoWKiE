"use strict";
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { execFile, spawn } = require("child_process");
const config = require("../config/config");
const workspace = require("./workspace-service");
const { resolveInside } = require("../security/path-guard");
const { killTree } = require("../security/process-guard");
const { AppError } = require("../utils/errors");
const log = require("../utils/logger");
const installer = require("./jdk-installer");

const { LIMITS, BUILD_DIR } = config;
const exe = (n) => (process.platform === "win32" ? n + ".exe" : n);

// Herramientas de un JDK concreto (home) o del PATH (home = null). Solo ejecutables fijos: nunca comandos del cliente.
function toolPath(home, name) { return home ? path.join(home, "bin", exe(name)) : name; }
const tool = (name) => toolPath(javaStatus && javaStatus.home, name);

function exec(file, args, opts) {
  return new Promise((resolve) => {
    execFile(file, args, Object.assign({ windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, opts), (err, stdout, stderr) => {
      resolve({ err, stdout: String(stdout || ""), stderr: String(stderr || "") });
    });
  });
}

function parseMajor(text) {
  const v = (/version "([^"]+)"/.exec(text) || /javac\s+([\d._]+)/.exec(text) || [])[1];
  if (!v) return null;
  const p = v.split(/[._]/);
  return p[0] === "1" ? Number(p[1]) : Number(p[0]);
}

// Evalúa un JDK candidato.
async function probe(home, source) {
  const j = await exec(toolPath(home, "java"), ["-version"], { timeout: 15000 });
  const c = await exec(toolPath(home, "javac"), ["-version"], { timeout: 15000 });
  const jText = j.stderr || j.stdout, cText = c.stderr || c.stdout;
  const javaOk = !j.err, javacOk = !c.err;
  const major = javaOk ? parseMajor(jText) : null;
  let state = "ready", message = "Java listo";
  if (!javaOk) { state = "missing"; message = "No se encontró Java."; }
  else if (!javacOk) { state = "no-jdk"; message = "Hay Java, pero falta el compilador (javac). Hace falta un JDK, no solo un JRE."; }
  else if (major && major < config.MIN_JAVA) { state = "old"; message = `Se necesita JDK ${config.MIN_JAVA} o superior; tienes la ${major}.`; }
  return { state, message, major, home, source, version: (jText.split("\n")[0] || "").trim(), javac: (cText.split("\n")[0] || "").trim() };
}

let javaStatus = null;
// Orden de preferencia: JAVA_HOME → JDK portátil instalado por LoWKie → PATH. Gana el primero que esté «listo».
// LOWKIE_IGNORE_SYSTEM_JAVA=1 ignora el Java del sistema (pruebas y forzar el portátil).
async function detect(force) {
  if (javaStatus && !force) return javaStatus;
  const cands = [];
  if (!process.env.LOWKIE_IGNORE_SYSTEM_JAVA) {
    if (process.env.JAVA_HOME) cands.push([process.env.JAVA_HOME, "JAVA_HOME"]);
  }
  const portable = installer.portableHome();
  if (portable) cands.push([portable, "portable"]);
  if (!process.env.LOWKIE_IGNORE_SYSTEM_JAVA) cands.push([null, "system"]);
  let best = null;
  for (const [home, source] of cands) {
    const r = await probe(home, source);
    if (r.state === "ready") { best = r; break; }
    if (!best || (best.state === "missing" && r.state !== "missing")) best = r;
  }
  if (!best) best = { state: "missing", message: "No se encontró Java.", major: null, home: null, source: null, version: "", javac: "" };
  best.canInstall = installer.status().supported;
  javaStatus = best;
  return javaStatus;
}

function requireReady(s) {
  if (s.state !== "ready") throw new AppError("JAVA_UNAVAILABLE", s.message, 503);
}

async function collectJava(root) {
  const out = [];
  async function walk(dir) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (e.isSymbolicLink() || e.name === BUILD_DIR || e.name.startsWith(".") || e.name === "node_modules") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name.endsWith(".java")) {
        out.push(path.relative(root, full));
        if (out.length > LIMITS.maxJavaFiles) throw new AppError("TOO_MANY_FILES", "Hay demasiados archivos .java en el proyecto.");
      }
    }
  }
  await walk(root);
  return out.sort();
}

// Traducción de errores habituales a mensajes comprensibles. El texto original se conserva.
const HINTS = [
  [/cannot find symbol/, "Java no reconoce un nombre. Revisa que esté escrito igual (mayúsculas incluidas) y que la variable esté declarada antes."],
  [/';' expected/, "Falta un punto y coma (;) al final de la instrucción anterior."],
  [/class, interface, enum, or record expected/, "Hay llaves { } de más o de menos, o código fuera de una clase."],
  [/reached end of file while parsing/, "Falta cerrar una llave }."],
  [/incompatible types/, "Estás guardando o devolviendo un tipo de dato que no encaja con el esperado."],
  [/missing return statement/, "El método debe devolver un valor en todos los caminos posibles."],
  [/might not have been initialized/, "Usas una variable antes de darle un valor."],
  [/should be declared in a file named/, "Una clase public debe estar en un archivo con su mismo nombre."],
  [/duplicate class/, "Hay dos clases con el mismo nombre en el proyecto. Cambia el nombre de una o usa paquetes."],
  [/not a statement/, "Esa línea no es una instrucción válida; revisa que no falte algo (por ejemplo una asignación =)."],
  [/array required, but/, "Usas [ ] sobre algo que no es un array."]
];
function diagnostics(stderr) {
  const diags = [];
  const re = /^(.+?\.java):(\d+): (error|warning): (.*)$/gm;
  let m;
  while ((m = re.exec(stderr))) {
    const hint = (HINTS.find(([r]) => r.test(m[4])) || [])[1] || null;
    diags.push({ file: m[1].split(path.sep).join("/"), line: Number(m[2]), severity: m[3], message: m[4], hint });
  }
  return diags;
}

let lastBuild = null;   // { root, ok, file } (file = null si se compiló todo el proyecto)

// Sin `body.file` compila todo el proyecto. Con `body.file` compila solo ese archivo y las clases que use
// (javac las busca en -sourcepath), así un ejercicio a medias no rompe la comprobación de otro.
async function compile(body) {
  const root = workspace.requireRoot();
  requireReady(await detect());
  let files, extra = [], target = null;
  if (body && body.file) {
    const r = await resolveInside(root, body.file);
    if (!r.rel.endsWith(".java")) throw new AppError("BAD_REQUEST", "Elige un archivo .java.");
    try { await fs.access(r.abs); } catch (e) { throw new AppError("NOT_FOUND", "El archivo no existe.", 404); }
    target = r.rel; files = [r.rel];
    extra = ["-sourcepath", r.rel.startsWith("src/") ? "src" : (path.posix.dirname(r.rel) || ".")];
  } else {
    files = await collectJava(root);
    if (!files.length) throw new AppError("NO_JAVA_FILES", "El proyecto no tiene archivos .java.");
  }
  const out = path.join(root, BUILD_DIR);
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });
  const started = Date.now();
  const r = await exec(tool("javac"), ["-encoding", "UTF-8", "-d", BUILD_DIR, ...extra, ...files], { cwd: root, timeout: LIMITS.compileTimeoutMs });
  const ok = !r.err;
  lastBuild = { root, ok, file: target };
  return { success: ok, exitCode: r.err ? (typeof r.err.code === "number" ? r.err.code : 1) : 0, durationMs: Date.now() - started,
    stdout: r.stdout, stderr: r.stderr, diagnostics: diagnostics(r.stderr), files: files.length };
}

// ---- Ejecución ----
const runs = new Map();
let activeId = null;

function mainClassFor(src, rel) {
  const pkg = /^\s*package\s+([\w.]+)\s*;/m.exec(src);
  const simple = path.basename(rel, ".java");
  return (pkg ? pkg[1] + "." : "") + simple;
}

async function run(body) {
  const root = workspace.requireRoot();
  requireReady(await detect());
  if (activeId && runs.get(activeId).status === "running") throw new AppError("RUN_ACTIVE", "Ya hay un programa en ejecución. Deténlo primero.", 409);
  if (!lastBuild || lastBuild.root !== root || !lastBuild.ok) throw new AppError("NOT_COMPILED", "Compila el proyecto antes de ejecutarlo.", 409);

  const { abs, rel } = await resolveInside(root, body && body.file);
  if (lastBuild.file && lastBuild.file !== rel) throw new AppError("NOT_COMPILED", "Compila este archivo antes de ejecutarlo.", 409);
  if (!rel.endsWith(".java")) throw new AppError("BAD_REQUEST", "Elige un archivo .java para ejecutar.");
  let src;
  try { src = await fs.readFile(abs, "utf8"); } catch (e) { throw new AppError("NOT_FOUND", "El archivo no existe.", 404); }
  if (!/static\s+void\s+main\s*\(/.test(src)) throw new AppError("NO_MAIN", "Este archivo no tiene un método main para ejecutar.");
  const cls = mainClassFor(src, rel);
  if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(cls)) throw new AppError("BAD_REQUEST", "Nombre de clase no válido.");

  const id = crypto.randomBytes(8).toString("hex");
  const rec = { id, status: "running", exitCode: null, chunks: [], bytes: 0, truncated: false, startedAt: Date.now(), durationMs: null, file: rel, child: null, timer: null };
  const push = (stream, buf) => {
    if (rec.bytes >= LIMITS.runOutputBytes) return;
    let text = buf.toString("utf8");
    if (rec.bytes + text.length > LIMITS.runOutputBytes) { text = text.slice(0, LIMITS.runOutputBytes - rec.bytes); rec.truncated = true; rec.chunks.push({ stream: "system", text: "\n[Salida truncada: se alcanzó el límite]\n" }); }
    rec.bytes += text.length;
    rec.chunks.push({ stream, text });
  };
  const finish = (status, code) => {
    if (rec.done) return;
    rec.done = true;
    if (rec.status === "running") rec.status = status;   // si ya es stopped/timeout se conserva
    rec.exitCode = code; rec.durationMs = Date.now() - rec.startedAt;
    clearTimeout(rec.timer); rec.child = null;
    if (activeId === id) activeId = null;
  };

  const child = spawn(tool("java"), ["-cp", BUILD_DIR, cls], {
    cwd: root, stdio: ["ignore", "pipe", "pipe"], windowsHide: true, detached: process.platform !== "win32"
  });
  rec.child = child;
  child.stdout.on("data", (d) => push("stdout", d));
  child.stderr.on("data", (d) => push("stderr", d));
  child.on("error", (e) => { log.error("spawn java", e); push("system", Buffer.from("No se pudo iniciar Java.\n")); finish("error", null); });
  child.on("close", (code) => finish(code === 0 ? "finished" : "failed", code));
  rec.timer = setTimeout(async () => {
    if (rec.status !== "running") return;
    push("system", Buffer.from(`\n[Tiempo agotado: el programa se detuvo tras ${LIMITS.runTimeoutMs / 1000} s]\n`));
    rec.status = "timeout"; await killTree(child);
  }, LIMITS.runTimeoutMs);

  runs.set(id, rec); activeId = id;
  for (const k of [...runs.keys()].slice(0, Math.max(0, runs.size - 20))) runs.delete(k);   // memoria acotada
  return { runId: id, mainClass: cls };
}

function status(id, after) {
  const rec = runs.get(id);
  if (!rec) throw new AppError("RUN_NOT_FOUND", "Ejecución no encontrada.", 404);
  const from = Math.max(0, Number(after) || 0);
  return { runId: id, status: rec.status, exitCode: rec.exitCode, durationMs: rec.durationMs != null ? rec.durationMs : Date.now() - rec.startedAt,
    truncated: rec.truncated, chunks: rec.chunks.slice(from), next: rec.chunks.length };
}

async function stop(id) {
  const rec = runs.get(id);
  if (!rec) throw new AppError("RUN_NOT_FOUND", "Ejecución no encontrada.", 404);
  if (rec.status === "running") {
    rec.status = "stopped"; rec.chunks.push({ stream: "system", text: "\n[Ejecución detenida]\n" });
    await killTree(rec.child);
  }
  return { status: rec.status };
}

async function stopAll() { for (const id of runs.keys()) { try { await stop(id); } catch (e) { /* ya detenida */ } } }

module.exports = { detect, installJava: () => installer.start(() => detect(true)), installStatus: () => installer.status(), compile, run, status, stop, stopAll, _diagnostics: diagnostics, _parseMajor: parseMajor };
