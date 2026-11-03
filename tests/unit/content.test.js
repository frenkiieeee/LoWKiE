"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { content, ROOT } = require("../helpers/load-content");

const C = content();
const TYPES = ["prediction", "interpretation", "detection", "completar", "ordenar", "programacion"];
const DIFFS = ["beginner", "intermediate", "challenge"];
const norm = (s) => String(s).replace(/\s+/g, " ").trim();

test("los 7 bloques de la sesión de 90 minutos suman 90", () => {
  assert.strictEqual(C.blocks.length, 7);
  assert.strictEqual(C.blocks.reduce((a, b) => a + b.minutes, 0), 90);
});

test("cada ejercicio se usa exactamente una vez en las lecciones", () => {
  const ids = C.exercises.map((e) => e.id);
  assert.strictEqual(new Set(ids).size, ids.length, "ids duplicados");
  const used = [];
  C.blocks.forEach((b) => b.steps.forEach((s) => { if (s.kind === "exercise") used.push(s.id); }));
  assert.strictEqual(JSON.stringify([...used].sort()), JSON.stringify([...ids].sort()));
});

test("se cubren los seis tipos de ejercicio de la spec", () => {
  for (const t of TYPES) assert.ok(C.exercises.some((e) => e.type === t), "falta el tipo " + t);
});

for (const ex of C.exercises) {
  test(`estructura del ejercicio ${ex.id} (${ex.type})`, () => {
    assert.ok(TYPES.includes(ex.type)); assert.ok(DIFFS.includes(ex.difficulty));
    assert.ok(C.topics[ex.topic], "concepto desconocido " + ex.topic);
    assert.ok(ex.title && ex.prompt && ex.explanation);
    assert.ok(Array.isArray(ex.hints) && ex.hints.length >= 1, "faltan pistas");
    if (ex.type === "prediction" || ex.type === "interpretation") {
      assert.ok(ex.options.includes(ex.correctAnswer), "la respuesta no está entre las opciones");
      assert.strictEqual(new Set(ex.options).size, ex.options.length);
      ex.options.filter((o) => o !== ex.correctAnswer).forEach((o) => assert.ok(ex.why[o], `falta explicar por qué «${o}» es incorrecta`));
    }
    if (ex.type === "detection") assert.ok(ex.correctAnswer >= 1 && ex.correctAnswer <= ex.lines.length);
    if (ex.type === "completar") {
      const slots = [...ex.template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
      assert.strictEqual(JSON.stringify(slots.sort()), JSON.stringify(ex.blanks.map((b) => b.id).sort()));
      ex.blanks.forEach((b) => assert.ok(b.options.includes(b.answer)));
    }
    if (ex.type === "ordenar") {
      const n = ex.lines.length, id = Array.from({ length: n }, (_, i) => i).join();
      ex.correctOrders.forEach((o) => assert.strictEqual([...o].sort((a, b) => a - b).join(), id, "no es una permutación"));
    }
    if (ex.type === "programacion") {
      assert.ok(/^ejercicios\/Ejercicio\d+\.java$/.test(ex.file));
      assert.ok(ex.starter.includes("class " + path.basename(ex.file, ".java")), "la clase no coincide con el archivo");
    }
  });
}

test("los ejercicios de programación usan archivos distintos", () => {
  const f = C.exercises.filter((e) => e.type === "programacion").map((e) => e.file);
  assert.strictEqual(new Set(f).size, f.length);
});

test("las reglas de recomendación usan conceptos y ejercicios existentes", () => {
  for (const r of C.recommendationRules) {
    r.topics.forEach((t) => assert.ok(C.topics[t], t));
    if (r.target.exercise) assert.ok(C.exerciseById(r.target.exercise));
  }
});

test("la plantilla del proyecto incluye los archivos de ejercicios", () => {
  for (const e of C.exercises.filter((x) => x.type === "programacion")) {
    const f = path.join(ROOT, "templates", "projects", "arrays", e.file);
    assert.ok(fs.existsSync(f), "falta en la plantilla: " + e.file);
    assert.strictEqual(fs.readFileSync(f, "utf8"), e.starter, "la plantilla no coincide con el enunciado: " + e.file);
  }
});

/* ---- Verificación con Java real ---- */
const exe = (n) => (process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", n) : n);
let javaOk = true;
try { execFileSync(exe("javac"), ["-version"], { stdio: "ignore" }); } catch (e) { javaOk = false; }

function runJava(dir, file, cls) {
  execFileSync(exe("javac"), ["-encoding", "UTF-8", "-d", path.join(dir, "out"), path.join(dir, file)], { stdio: "pipe" });
  return execFileSync(exe("java"), ["-cp", path.join(dir, "out"), cls], { encoding: "utf8", timeout: 20000 });
}
const wrap = (body) => `public class Main { public static void main(String[] args) throws Exception {\n${body}\n} }\n`;

for (const ex of C.exercises) {
  let body = null, expected = null;
  const v = ex.verify;
  if (ex.type === "programacion") continue;
  if (v === true) { body = ex.code; expected = ex.correctAnswer; }
  else if (v && v.body) { body = v.body; expected = v.output; }
  else if (ex.type === "completar" && v) {
    body = (v.prelude || "") + ex.template.replace(/\{\{(\w+)\}\}/g, (_, id) => ex.blanks.filter((b) => b.id === id)[0].answer); expected = v.output;
  } else if (ex.type === "ordenar" && v) { body = ex.correctOrders.map((o) => o.map((i) => ex.lines[i]).join("\n")).join("\n@@@\n"); expected = v.output; }
  if (!body) continue;
  test(`Java real confirma la respuesta de ${ex.id}`, { skip: javaOk ? false : "No hay JDK" }, () => {
    // Para «ordenar» se prueba cada orden válido.
    for (const variant of body.split("\n@@@\n")) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-ex-"));
      fs.writeFileSync(path.join(dir, "Main.java"), wrap(variant));
      assert.strictEqual(norm(runJava(dir, "Main.java", "Main")), norm(expected), `salida distinta en ${ex.id}`);
    }
  });
}

for (const ex of C.exercises.filter((e) => e.type === "programacion")) {
  test(`Java real: ${ex.id} — la solución da la salida esperada y el enunciado inicial NO`, { skip: javaOk ? false : "No hay JDK" }, () => {
    const cls = path.basename(ex.file, ".java");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lowkie-pr-"));
    fs.writeFileSync(path.join(dir, cls + ".java"), ex.starter);
    assert.notStrictEqual(norm(runJava(dir, cls + ".java", cls)), norm(ex.expectedOutput), "el enunciado inicial ya pasaría la comprobación");
    fs.writeFileSync(path.join(dir, cls + ".java"), ex.solution);
    assert.strictEqual(norm(runJava(dir, cls + ".java", cls)), norm(ex.expectedOutput));
  });
}
