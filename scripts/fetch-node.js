"use strict";
// Descarga Node.js LTS fijado para cada plataforma y lo deja en runtime/node/<plataforma>/.
// Verifica el SHA-256 contra SHASUMS256.txt de nodejs.org antes de extraer.
// Uso: node scripts/fetch-node.js [all | darwin-arm64 darwin-x64 linux-x64 linux-arm64 win-x64]
const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const VERSION = "v24.22.1";   // Node 24 LTS. Cambiar aquí al actualizar.
const ALL = ["darwin-arm64", "darwin-x64", "linux-x64", "linux-arm64", "win-x64"];
const DEST = path.join(__dirname, "..", "runtime", "node");

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(get(res.headers.location));
      if (res.statusCode !== 200) return reject(new Error(`${url} → HTTP ${res.statusCode}`));
      const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function fetchOne(plat, sums) {
  const isWin = plat.startsWith("win");
  const file = `node-${VERSION}-${plat}.${isWin ? "zip" : "tar.gz"}`;
  const expected = (sums.split("\n").find((l) => l.endsWith("  " + file)) || "").split(" ")[0];
  if (!expected) throw new Error(`No hay checksum para ${file}`);
  console.log(`↓ ${file}`);
  const buf = await get(`https://nodejs.org/dist/${VERSION}/${file}`);
  const actual = crypto.createHash("sha256").update(buf).digest("hex");
  if (actual !== expected) throw new Error(`SHA-256 no coincide para ${file}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-node-"));
  const archive = path.join(tmp, file);
  fs.writeFileSync(archive, buf);
  execFileSync("tar", ["-xf", archive, "-C", tmp]);   // bsdtar de Windows 10+ también extrae .zip
  const out = path.join(DEST, plat);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(DEST, { recursive: true });
  fs.renameSync(path.join(tmp, `node-${VERSION}-${plat}`), out);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`✓ runtime/node/${plat}`);
}

(async () => {
  const args = process.argv.slice(2);
  const targets = !args.length || args[0] === "all" ? ALL : args;
  for (const t of targets) if (!ALL.includes(t)) { console.error(`Plataforma desconocida: ${t}`); process.exit(2); }
  const sums = (await get(`https://nodejs.org/dist/${VERSION}/SHASUMS256.txt`)).toString("utf8");
  for (const t of targets) await fetchOne(t, sums);
})().catch((e) => { console.error(e.message); process.exit(1); });
