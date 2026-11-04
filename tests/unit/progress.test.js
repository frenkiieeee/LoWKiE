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

/* ---- Compatibilidad: el progreso guardado con la versión anterior sigue valiendo ---- */
// Instantánea real de un alumno que terminó toda la unidad base con la versión 0.1.2.
function legacy() {
  const L = withProgress(), C = L.content;
  const base = C.blocks.flatMap((b) => b.steps.map((s, i) => [b.id, i, s]));
  const snap = { version: 1, unit: "java-arrays", currentActivity: "b7:3", completed: [], attempts: {}, correct: {}, hints: { a1: 1 }, revealed: ["m3"], steps: [], reinforce: [], lastActivity: "2026-11-03T10:00:00.000Z", recommendationsShown: [] };
  base.forEach(([bid, i, s]) => { if (s.kind === "exercise") { if (s.id !== "m3") { snap.completed.push(s.id); snap.correct[s.id] = 1; snap.attempts[s.id] = 1; } } else snap.steps.push(bid + ":" + i); });
  return snap;
}
function loadSnapshot(snap) {
  const L = withProgress();
  L.progress.importData({ kind: "progress", progress: snap });
  return L;
}
test("progreso antiguo: la unidad base sigue al 100 % tras añadir «Avanzando»", () => {
  const L = loadSnapshot(legacy());
  assert.strictEqual(L.progress.overall().percent, 100);
  assert.strictEqual(L.progress.nextStep(), null);
  assert.strictEqual(L.progress.overall(L.progress.advBlocks()).percent, 0);
});
test("progreso antiguo: tras la unidad base se recomienda empezar Avanzando (no se pierde nada)", () => {
  const L = loadSnapshot(legacy());
  const r = L.progress.recommend();
  assert.strictEqual(r.id, "advance");
  assert.match(r.route, /^#\/leccion\/x1\/0$/);
});
test("progreso antiguo: intentos, pistas y soluciones vistas se conservan", () => {
  const P = loadSnapshot(legacy()).progress, p = P.get();
  assert.strictEqual(p.hints.a1, 1);
  assert.ok(p.revealed.includes("m3"));
  assert.ok(P.isExerciseDone("m3"));
});
test("las dos pistas tienen progresos independientes", () => {
  const { P, C } = fresh();
  P.visit("x1", 0); P.attempt("x1a", true);
  assert.ok(P.overall(P.advBlocks()).percent > 0);
  assert.strictEqual(P.overall().percent, 0);
  assert.strictEqual(P.stats().completed, 1);
  assert.strictEqual(P.stats(C.blocks).completed, 0);
});
test("fallos en referencias recomiendan el simulador de referencias", () => {
  const { P } = fresh();
  P.visit("b1", 0); P.attempt("x2c", false); P.attempt("x2c", false);
  const r = P.recommend();
  assert.strictEqual(r.id, "adv-references");
  assert.strictEqual(r.route, "#/simuladores/refs");
});
test("importar una copia FUSIONA: no borra lo que ya hay y toma el máximo de intentos", () => {
  const { P } = fresh();
  P.attempt("d1", true); P.attempt("d1", false);
  P.importData({ kind: "progress", progress: { completed: ["d2"], steps: ["b1:0"], attempts: { d1: 1, d2: 3 }, correct: { d2: 1 }, hints: {} } });
  const p = P.get();
  assert.ok(p.completed.includes("d1") && p.completed.includes("d2"));
  assert.strictEqual(p.attempts.d1, 2);   // se conserva el mayor
  assert.strictEqual(p.attempts.d2, 3);
});
test("importar rechaza archivos que no son una copia de progreso", () => {
  const { P } = fresh();
  assert.throws(() => P.importData({ foo: 1 }));
  assert.throws(() => P.importData({ kind: "progress", progress: { completed: "x" } }));
});
