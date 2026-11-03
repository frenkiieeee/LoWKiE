/* Progreso del alumno + motor de recomendaciones.
   Se guarda SIEMPRE en localStorage (funciona con file://) y, si hay servicio local, también en
   %APPDATA%/LoWKie/progress.json, que sobrevive aunque cambie el puerto del navegador. */
(function (L) {
  var KEY = "lowkie:v0.2.0:progress";
  var C = L.content;
  var data = null, saveTimer = null;

  function blank() {
    return { version: 1, unit: C.unit.id, currentActivity: null, completed: [], attempts: {}, correct: {}, hints: {},
      revealed: [], steps: [], reinforce: [], lastActivity: null, recommendationsShown: [] };
  }
  function lsRead() { try { var r = window.localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function lsWrite(o) { try { window.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* sin persistencia local */ } }
  function get() { if (!data) data = Object.assign(blank(), lsRead() || {}); return data; }
  function persist() {
    data.lastActivity = new Date().toISOString();
    lsWrite(data);
    if (L.api && L.api.available) {   // sincroniza sin bloquear la interfaz
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { L.api.putProgress(data).catch(function () {}); }, 400);
    }
  }
  // Al arrancar con servicio: gana el progreso con actividad más reciente.
  function sync() {
    if (!(L.api && L.api.available)) return Promise.resolve();
    return L.api.getProgress().then(function (r) {
      var server = r.progress, local = get();
      if (server && server.lastActivity && (!local.lastActivity || server.lastActivity > local.lastActivity)) {
        data = Object.assign(blank(), server); lsWrite(data);
      } else if (local.lastActivity) { L.api.putProgress(local).catch(function () {}); }
    }).catch(function () {});
  }
  function add(list, v) { if (list.indexOf(v) < 0) list.push(v); }

  // ---------- Consultas ----------
  var stepKey = function (b, i) { return b + ":" + i; };
  function isExerciseDone(id) { var p = get(); return p.completed.indexOf(id) >= 0 || p.revealed.indexOf(id) >= 0; }
  function stepDone(block, i) {
    var s = block.steps[i];
    if (s.kind === "exercise") return isExerciseDone(s.id);
    return get().steps.indexOf(stepKey(block.id, i)) >= 0;
  }
  function blockStatus(block) {
    var done = 0; block.steps.forEach(function (s, i) { if (stepDone(block, i)) done++; });
    return { done: done, total: block.steps.length, complete: done === block.steps.length, started: done > 0 };
  }
  function overall() {
    var done = 0, total = 0;
    C.blocks.forEach(function (b) { var s = blockStatus(b); done += s.done; total += s.total; });
    return { done: done, total: total, percent: total ? Math.round(done * 100 / total) : 0 };
  }
  // Primer paso sin completar (bloque e índice). null si todo está hecho.
  function nextStep() {
    for (var b = 0; b < C.blocks.length; b++)
      for (var i = 0; i < C.blocks[b].steps.length; i++)
        if (!stepDone(C.blocks[b], i)) return { block: C.blocks[b], index: i };
    return null;
  }
  function blockState(block) {
    var s = blockStatus(block);
    if (s.complete) return "done";
    var nx = nextStep();
    return nx && nx.block.id === block.id ? "current" : "todo";
  }
  function locate(exerciseId) {   // dónde vive un ejercicio en la lección
    for (var b = 0; b < C.blocks.length; b++)
      for (var i = 0; i < C.blocks[b].steps.length; i++) {
        var s = C.blocks[b].steps[i];
        if (s.kind === "exercise" && s.id === exerciseId) return { block: C.blocks[b], index: i };
      }
    return null;
  }
  function mistakes(topics) {
    var p = get(), n = 0;
    C.exercises.forEach(function (e) {
      if (topics.indexOf(e.topic) < 0) return;
      n += Math.max(0, (p.attempts[e.id] || 0) - (p.correct[e.id] || 0));
      if (p.revealed.indexOf(e.id) >= 0 && !(p.correct[e.id])) n += 1;
    });
    return n;
  }
  function stats() {
    var p = get(), attempts = 0, correct = 0, hints = 0;
    C.exercises.forEach(function (e) { attempts += p.attempts[e.id] || 0; correct += p.correct[e.id] || 0; hints += p.hints[e.id] || 0; });
    return { attempts: attempts, correct: correct, wrong: attempts - correct, hints: hints, completed: p.completed.length, revealed: p.revealed.length };
  }
  function toRoute(target) {
    if (target.route) return target.route;
    if (target.sim) return "#/simuladores/" + target.sim;
    var loc = locate(target.exercise);
    return loc ? "#/leccion/" + loc.block.id + "/" + loc.index : "#/leccion";
  }
  function routeToStep(loc) { return "#/leccion/" + loc.block.id + "/" + loc.index; }

  // ---------- Recomendación (primera regla que se cumple) ----------
  function recommend() {
    var p = get(), s = stats();
    if (!p.lastActivity && !p.steps.length && !p.completed.length) {
      return { id: "start", reason: "Empezamos con un diagnóstico corto para ver tus conocimientos de base.",
        concept: "Variables, condiciones y bucles", activity: "Diagnóstico inicial", minutes: 8, route: "#/leccion/b1" };
    }
    var rules = C.recommendationRules;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (mistakes(r.topics) >= r.minMistakes) return { id: r.id, reason: r.reason, concept: r.concept, activity: r.activity, minutes: r.minutes, route: toRoute(r.target) };
    }
    var ch = C.challengeRule, done = p.completed.length;
    if (done >= ch.minCompleted && s.attempts && (s.wrong / s.attempts) <= ch.maxMistakeRatio) {
      var challenge = C.exercises.filter(function (e) { return e.difficulty === "challenge" && !isExerciseDone(e.id); })[0];
      if (challenge) return { id: "challenge", reason: ch.reason, concept: ch.concept, activity: challenge.title, minutes: ch.minutes, route: toRoute({ exercise: challenge.id }) };
    }
    var nx = nextStep();
    if (nx) return { id: "continue", reason: "Sigue por donde lo dejaste: el siguiente paso te espera.", concept: nx.block.title,
      activity: "Continuar: " + nx.block.title, minutes: nx.block.minutes, route: routeToStep(nx) };
    return { id: "done", reason: "Has completado la unidad. Repasa tus conceptos o practica en Code Space.", concept: "Repaso libre",
      activity: "Abrir Code Space", minutes: 10, route: "#/code-space" };
  }
  // Conceptos a reforzar (para el resumen): ordenados por número de fallos.
  function weakTopics() {
    return Object.keys(C.topics).map(function (t) { return { topic: t, label: C.topics[t], mistakes: mistakes([t]) }; })
      .filter(function (x) { return x.mistakes > 0; }).sort(function (a, b) { return b.mistakes - a.mistakes; });
  }

  // ---------- Escritura ----------
  L.progress = {
    get: get, sync: sync, overall: overall, blockStatus: blockStatus, blockState: blockState, stepDone: stepDone, nextStep: nextStep,
    isExerciseDone: isExerciseDone, locate: locate, stats: stats, recommend: recommend, weakTopics: weakTopics, mistakes: mistakes, routeToStep: routeToStep,
    visit: function (blockId, i) { var p = get(); add(p.steps, stepKey(blockId, i)); p.currentActivity = stepKey(blockId, i); persist(); },
    attempt: function (id, ok) {
      var p = get(); p.attempts[id] = (p.attempts[id] || 0) + 1;
      if (ok) { p.correct[id] = (p.correct[id] || 0) + 1; add(p.completed, id); }
      p.reinforce = weakTopics().map(function (x) { return x.topic; });
      persist();
    },
    hint: function (id, n) { var p = get(); p.hints[id] = Math.max(p.hints[id] || 0, n); persist(); },
    reveal: function (id) { var p = get(); add(p.revealed, id); p.reinforce = weakTopics().map(function (x) { return x.topic; }); persist(); },
    shown: function (id) { var p = get(); add(p.recommendationsShown, id); persist(); },
    reset: function () { data = blank(); lsWrite(data); if (L.api && L.api.available) L.api.putProgress(blank()).catch(function () {}); }
  };
})(window.LoWKie = window.LoWKie || {});
