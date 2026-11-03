"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { resolveInside } = require("../../runtime/src/security/path-guard");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-pg-"));
const ws = path.join(tmp, "ws"); const outside = path.join(tmp, "outside");
fs.mkdirSync(path.join(ws, "src"), { recursive: true }); fs.mkdirSync(outside);
fs.writeFileSync(path.join(outside, "secret.txt"), "x");

test("acepta rutas relativas dentro del workspace", async () => {
  const r = await resolveInside(ws, "src/Main.java");
  assert.strictEqual(r.rel, "src/Main.java");
});
test("la raíz es válida (cadena vacía)", async () => {
  assert.strictEqual((await resolveInside(ws, "")).rel, "");
});
for (const bad of ["../outside/secret.txt", "src/../../outside", "/etc/passwd", "C:/Windows", "src\\..\\x", "a\0b"]) {
  test(`rechaza ${JSON.stringify(bad)}`, async () => {
    await assert.rejects(() => resolveInside(ws, bad), { code: "WORKSPACE_PATH_INVALID" });
  });
}
test("rechaza tipos que no son string", async () => {
  await assert.rejects(() => resolveInside(ws, null), { code: "WORKSPACE_PATH_INVALID" });
});
test("rechaza enlaces simbólicos que escapan", { skip: process.platform === "win32" }, async () => {
  fs.symlinkSync(outside, path.join(ws, "link"));
  await assert.rejects(() => resolveInside(ws, "link/secret.txt"), { code: "WORKSPACE_PATH_INVALID" });
  await assert.rejects(() => resolveInside(ws, "link/nuevo.txt"), { code: "WORKSPACE_PATH_INVALID" });
});
