"use strict";
// Genera dist/LoWKie-v<versión>[-<plataforma>]/ y su ZIP.
//   node scripts/package.js                      → incluye todos los Node que haya en runtime/node/
//   node scripts/package.js --platform=win-x64   → ZIP ligero para un sistema (descarga su Node si falta)
//   node scripts/package.js --no-zip
// Plataformas: darwin-arm64 · darwin-x64 · linux-x64 · linux-arm64 · win-x64
// Construye el ZIP en macOS/Linux: así conserva los permisos de ejecución de los lanzadores.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const version = require("../package.json").version;
const arg = (n) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a && a.split("=")[1]; };
const platform = arg("platform");
const name = `LoWKie-v${version}` + (platform ? "-" + platform : "");
const out = path.join(ROOT, "dist", name);

if (platform && !fs.existsSync(path.join(ROOT, "runtime", "node", platform))) {
  execFileSync(process.execPath, [path.join(__dirname, "fetch-node.js"), platform], { stdio: "inherit" });
}

const INCLUDE = ["index.html", "app", "content", "templates", "licenses", "runtime/src", "package.json", "README.md",
  "scripts/get-node.sh", "scripts/get-node.ps1",
  "Start-LoWKie.bat", "Stop-LoWKie.bat", "Start-LoWKie.command", "Stop-LoWKie.command", "Start-LoWKie.terminal", "start-lowkie.sh", "stop-lowkie.sh"];
const SKIP = new Set([".DS_Store", ".gitkeep"]);

function copy(src, dst) {
  const st = fs.lstatSync(src);
  if (st.isSymbolicLink()) return;
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) if (!SKIP.has(f)) copy(path.join(src, f), path.join(dst, f));
  } else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); fs.chmodSync(dst, st.mode); }
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  if (!fs.existsSync(src)) { console.warn(`(falta ${item})`); continue; }
  copy(src, path.join(out, item));
}
// Node portátil: el de la plataforma pedida, o todos los que haya descargados.
const nodeSrc = path.join(ROOT, "runtime", "node");
const wanted = platform ? [platform] : (fs.existsSync(nodeSrc) ? fs.readdirSync(nodeSrc).filter((d) => !d.startsWith(".")) : []);
for (const p of wanted) copy(path.join(nodeSrc, p), path.join(out, "runtime", "node", p));
console.log(`Paquete: dist/${name}  ·  Node incluido para: ${wanted.length ? wanted.join(", ") : "ninguna plataforma (se ofrecerá descargarlo en el primer arranque)"}`);

if (!process.argv.includes("--no-zip")) {
  try {
    fs.rmSync(out + ".zip", { force: true });
    if (process.platform === "win32") execFileSync("powershell.exe", ["-NoProfile", "-Command", `Compress-Archive -Path '${out}' -DestinationPath '${out}.zip' -Force`], { stdio: "inherit" });
    else execFileSync("zip", ["-qrX", `${name}.zip`, name], { cwd: path.join(ROOT, "dist"), stdio: "inherit" });
    console.log(`ZIP: dist/${name}.zip (${Math.round(fs.statSync(out + ".zip").size / 1048576)} MB)`);
  } catch (e) { console.warn("No se pudo crear el ZIP automáticamente; comprime la carpeta dist/" + name + " a mano."); }
}
