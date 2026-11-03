"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const inst = require("../../runtime/src/services/jdk-installer");

const asset = (over) => [{ release_name: "jdk-21.0.1+1", binary: { package: Object.assign({
  name: "OpenJDK21U.tar.gz", link: "https://github.com/adoptium/temurin21-binaries/releases/download/x/OpenJDK21U.tar.gz",
  checksum: "a".repeat(64), size: 1000 }, over) } }];

test("pickAsset acepta una respuesta válida de Adoptium", () => {
  const a = inst.pickAsset(asset());
  assert.strictEqual(a.name, "OpenJDK21U.tar.gz"); assert.strictEqual(a.sha256, "a".repeat(64));
});
test("pickAsset rechaza enlaces que no son de Adoptium", () => {
  assert.throws(() => inst.pickAsset(asset({ link: "https://evil.example/jdk.tar.gz" })));
  assert.throws(() => inst.pickAsset(asset({ link: "http://github.com/adoptium/x.tar.gz" })));
});
test("pickAsset rechaza sumas de verificación mal formadas o ausentes", () => {
  assert.throws(() => inst.pickAsset(asset({ checksum: "zzz" })));
  assert.throws(() => inst.pickAsset(asset({ checksum: undefined })));
  assert.throws(() => inst.pickAsset([]));
});
test("findHome localiza el JDK en el diseño de Linux/Windows y de macOS", () => {
  const exe = process.platform === "win32" ? "javac.exe" : "javac";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-jdk-"));
  const linux = path.join(tmp, "jdk-21", "bin"); fs.mkdirSync(linux, { recursive: true }); fs.writeFileSync(path.join(linux, exe), "");
  assert.strictEqual(inst.findHome(tmp), path.join(tmp, "jdk-21"));
  const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-jdk-"));
  const mac = path.join(tmp2, "jdk-21.jdk", "Contents", "Home", "bin"); fs.mkdirSync(mac, { recursive: true }); fs.writeFileSync(path.join(mac, exe), "");
  assert.strictEqual(inst.findHome(tmp2), path.join(tmp2, "jdk-21.jdk", "Contents", "Home"));
  assert.strictEqual(inst.findHome(fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-jdk-"))), null);
});
test("platform devuelve os/arquitectura de Adoptium para este sistema", () => {
  const p = inst.platform();
  if (p) { assert.ok(["mac", "linux", "windows"].includes(p.os)); assert.ok(["x64", "aarch64"].includes(p.arch)); }
});
