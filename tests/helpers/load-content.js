"use strict";
// Carga los scripts de contenido y del motor de progreso (pensados para el navegador) en un contexto aislado.
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

function load(files) {
  const store = {};
  const window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } } };
  const ctx = vm.createContext({ window, console });
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  return window.LoWKie;
}
const CONTENT = ["content/java/arrays/lesson.js", "content/java/arrays/exercises.js", "content/java/arrays/recommendations.js"];
module.exports = {
  ROOT,
  content: () => load(CONTENT).content,
  withProgress: () => load([...CONTENT, "app/scripts/progress.js"])
};
