"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { withProgress } = require("../helpers/load-content");

function fresh() { const L = withProgress(); return { L, P: L.progress, C: L.content }; }

test("al empezar se recomienda el diagnóstico y el progreso es 0", () => {
  const { P } = fresh();
  assert.strictEqual(P.overall().percent, 0);
  assert.strictEqual(P.recommend().id, "start");
});
test("un acierto completa el paso y suma intento y acierto", () => {
  const { P } = fresh();
  P.attempt("d1", true);
  assert.ok(P.isExerciseDone("d1"));
  assert.strictEqual([P.stats().attempts, P.stats().correct, P.stats().wrong].join(), "1,1,0");
  assert.ok(P.overall().percent > 0);
});
test("dos fallos de índice recomiendan el simulador 1D", () => {
  const { P } = fresh();
  P.visit("b1", 0);
  P.attempt("a1", false); P.attempt("a1", false);
  const r = P.recommend();
  assert.strictEqual(r.id, "index-access");
  assert.strictEqual(r.route, "#/simuladores/1d");
});
test("un fallo índice/valor recomienda ese ejercicio concreto", () => {
  const { P } = fresh();
  P.visit("b1", 0); P.attempt("a2", false);
  const r = P.recommend();
  assert.strictEqual(r.id, "index-vs-value");
  assert.match(r.route, /^#\/leccion\/b2\/\d+$/);
});
test("ver la solución cuenta como fallo y como paso completado (con ayuda)", () => {
  const { P } = fresh();
  P.visit("b1", 0); P.reveal("m1");
  assert.ok(P.isExerciseDone("m1"));
  assert.strictEqual(P.mistakes(["matrix-rowcol"]), 1);
});
test("buen rendimiento propone un reto", () => {
  const { P, C } = fresh();
  P.visit("b1", 0);
  C.exercises.filter((e) => e.difficulty !== "challenge" && e.type !== "programacion").slice(0, 9).forEach((e) => P.attempt(e.id, true));
  const r = P.recommend();
  assert.strictEqual(r.id, "challenge");
});
test("el progreso persiste (localStorage) y se puede borrar", () => {
  const L = withProgress(); L.progress.attempt("d1", true);
  const saved = L.progress.get().completed.slice();
  assert.strictEqual(JSON.stringify(saved), '["d1"]');
  L.progress.reset();
  assert.strictEqual(L.progress.get().completed.length, 0);
});
test("el estado de los bloques sigue el orden de la unidad", () => {
  const { P, C } = fresh();
  assert.strictEqual(P.blockState(C.blocks[0]), "current");
  assert.strictEqual(P.blockState(C.blocks[1]), "todo");
});
