"use strict";
const test = require("node:test");
const assert = require("node:assert");
const java = require("../../runtime/src/services/java-service");

test("parseMajor entiende versiones modernas y antiguas", () => {
  assert.strictEqual(java._parseMajor('openjdk version "21.0.2" 2024-01-16'), 21);
  assert.strictEqual(java._parseMajor('java version "1.8.0_301"'), 8);
  assert.strictEqual(java._parseMajor("javac 25.0.2"), 25);
  assert.strictEqual(java._parseMajor("nada"), null);
});
test("diagnostics extrae línea y añade pista", () => {
  const d = java._diagnostics("src/Main.java:7: error: ';' expected\n  int x = 1\n           ^\n1 error");
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].file, "src/Main.java");
  assert.strictEqual(d[0].line, 7);
  assert.ok(d[0].hint.includes("punto y coma"));
});
test("diagnostics conserva el mensaje original aunque no haya pista", () => {
  const d = java._diagnostics("A.java:1: error: algo raro nunca visto");
  assert.strictEqual(d[0].message, "algo raro nunca visto");
  assert.strictEqual(d[0].hint, null);
});
