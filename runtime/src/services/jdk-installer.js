"use strict";
// Instala un JDK Temurin portátil en el perfil del usuario (DATA_DIR/jdk), sin permisos de administrador.
// El usuario lo pide desde la interfaz (botón). Se descarga de adoptium.net/GitHub y se verifica su SHA-256.
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const { execFile } = require("child_process");
const config = require("../config/config");
const log = require("../utils/logger");

const API = "https://api.adoptium.net";
const OS = { darwin: "mac", linux: "linux", win32: "windows" };
const ARCH = { x64: "x64", arm64: "aarch64" };
const ALLOWED_HOSTS = [/^api\.adoptium\.net$/, /^github\.com$/, /(^|\.)githubusercontent\.com$/];
const exe = (n) => (process.platform === "win32" ? n + ".exe" : n);

const jdkDir = () => path.join(config.DATA_DIR, "jdk", String(config.MIN_JAVA));

function platform() {
  const os = OS[process.platform], arch = ARCH[process.arch];
  return os && arch ? { os, arch } : null;
}

// Elige el binario (jdk, hotspot) de la respuesta de la API y comprueba que el enlace es de Adoptium.
function pickAsset(json) {
  const a = Array.isArray(json) && json[0];
  const pk = a && a.binary && a.binary.package;
  if (!pk || !pk.link || !pk.checksum || !pk.name) throw new Error("Respuesta inesperada de Adoptium.");
  if (!/^https:\/\/github\.com\/adoptium\//.test(pk.link)) throw new Error("Enlace de descarga no reconocido.");
  if (!/^[a-f0-9]{64}$/.test(pk.checksum)) throw new Error("Suma de verificación no válida.");
  return { name: pk.name, link: pk.link, sha256: pk.checksum, size: pk.size || 0, release: a.release_name };
}

// Busca bin/java dentro de una carpeta extraída (Linux/Windows: bin; macOS: Contents/Home/bin).
function findHome(dir) {
  const candidates = [dir, path.join(dir, "Contents", "Home")];
  try { for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) { candidates.push(path.join(dir, e.name)); candidates.push(path.join(dir, e.name, "Contents", "Home")); } } catch (e) { return null; }
  return candidates.find((c) => fs.existsSync(path.join(c, "bin", exe("javac")))) || null;
}
function portableHome() { return findHome(jdkDir()); }

function get(url, { json, onResponse, redirects = 6 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.some((r) => r.test(u.hostname))) return reject(new Error("Dirección de descarga no permitida."));
    https.get(u, { headers: { "User-Agent": "LoWKie" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (!redirects) return reject(new Error("Demasiadas redirecciones."));
        return resolve(get(new URL(res.headers.location, u).toString(), { json, onResponse, redirects: redirects - 1 }));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("Error HTTP " + res.statusCode)); }
      if (onResponse) return resolve(onResponse(res));
      const chunks = []; res.on("data", (c) => chunks.push(c));
      res.on("end", () => { const b = Buffer.concat(chunks).toString("utf8"); try { resolve(json ? JSON.parse(b) : b); } catch (e) { reject(e); } });
      res.on("error", reject);
    }).on("error", reject);
  });
}

function download(url, dest, onProgress) {
  return get(url, { onResponse: (res) => new Promise((resolve, reject) => {
    const total = Number(res.headers["content-length"]) || 0; let got = 0;
    const hash = crypto.createHash("sha256"), out = fs.createWriteStream(dest);
    res.on("data", (c) => { got += c.length; hash.update(c); onProgress(got, total); });
    res.pipe(out);
    out.on("finish", () => resolve(hash.digest("hex")));
    out.on("error", reject); res.on("error", reject);
  }) });
}

const job = { status: "idle", phase: "", percent: 0, message: "", error: null };
let running = null;
const set = (p) => Object.assign(job, p);

async function run(onDone) {
  const pf = platform();
  if (!pf) throw new Error("Este sistema no tiene instalación automática de Java.");
  set({ status: "running", phase: "Buscando la versión", percent: 0, message: "", error: null });
  const assets = await get(`${API}/v3/assets/latest/${config.MIN_JAVA}/hotspot?architecture=${pf.arch}&image_type=jdk&os=${pf.os}&vendor=eclipse`, { json: true });
  const asset = pickAsset(assets);

  const base = path.join(config.DATA_DIR, "jdk");
  await fsp.mkdir(base, { recursive: true });
  const tmp = await fsp.mkdtemp(path.join(base, ".tmp-"));
  try {
    const file = path.join(tmp, asset.name);
    set({ phase: "Descargando Java (" + asset.release + ")" });
    const digest = await download(asset.link, file, (got, total) => set({ percent: Math.min(90, Math.round(((total || asset.size) ? got / (total || asset.size) : 0) * 90)) }));
    set({ phase: "Verificando integridad", percent: 91 });
    if (digest !== asset.sha256) throw new Error("La verificación de integridad ha fallado. No se ha instalado nada.");
    set({ phase: "Instalando", percent: 93 });
    const ex = path.join(tmp, "x"); await fsp.mkdir(ex);
    await new Promise((res, rej) => execFile("tar", ["-xf", file, "-C", ex], { windowsHide: true, timeout: 5 * 60 * 1000 }, (e) => (e ? rej(new Error("No se pudo descomprimir el JDK.")) : res())));
    if (!findHome(ex)) throw new Error("El paquete descargado no contiene un JDK válido.");
    await fsp.rm(jdkDir(), { recursive: true, force: true });
    await fsp.mkdir(path.dirname(jdkDir()), { recursive: true });
    await fsp.rename(ex, jdkDir());
    await onDone();
    set({ status: "done", phase: "Java instalado", percent: 100, message: asset.release });
    log.info("JDK instalado: " + asset.release);
  } finally { await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {}); }
}

// Inicia la instalación (una sola a la vez). Devuelve el estado actual.
function start(onDone) {
  if (running) return status();
  running = run(onDone).catch((e) => { log.error("instalación de JDK", e); set({ status: "error", error: e.message || "No se pudo instalar Java." }); })
    .finally(() => { running = null; });
  return status();
}
function status() { return Object.assign({ supported: !!platform() }, job); }

module.exports = { start, status, portableHome, findHome, pickAsset, platform, jdkDir };
