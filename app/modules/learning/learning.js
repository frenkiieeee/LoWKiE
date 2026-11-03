/* Ruta de aprendizaje y Learning Space (reproductor de lecciones). */
(function (L) {
  var h = L.ui.h, ui = L.ui, C = L.content, P = L.progress;
  var STATE_LABEL = { done: "Completado", current: "En curso", todo: "Pendiente" };

  function blockIndex(id) { for (var i = 0; i < C.blocks.length; i++) if (C.blocks[i].id === id) return i; return -1; }
  function badge(state) { return h("span.badge.badge--" + state, null, STATE_LABEL[state]); }

  /* ---------- Ruta ---------- */
  L.router.register("/aprendizaje", "Ruta de aprendizaje", function () {
    var nx = P.nextStep();
    return h("div", null,
      ui.pageHeader("Unidad 01 · " + C.unit.title, "Ruta de aprendizaje",
        "Siete bloques para una sesión de 90 minutos. Puedes entrar en cualquiera: el profesor puede detenerse, repetir o saltar actividades."),
      nx ? h("div", null, ui.button("Continuar: " + nx.block.title, P.routeToStep(nx))) : h("p.lead", null, "Has completado toda la unidad."),
      h("ol.rows.rows--link", null, C.blocks.map(function (b, i) {
        var st = P.blockStatus(b), state = P.blockState(b);
        return h("li", null,
          h("span.rows__num", null, "0" + (i + 1)),
          h("div", null,
            h("a.rows__title.rows__a", { href: "#/leccion/" + b.id }, b.title),
            h("p.rows__meta", null, b.time + " min · " + b.goal + " · " + st.done + "/" + st.total + " pasos")),
          badge(state));
      })));
  });

  /* ---------- Lección ---------- */
  L.router.register("/leccion", "Lección actual", function (args) {
    var bi = args[0] ? blockIndex(args[0]) : -1, block, idx;
    if (bi < 0) {   // sin bloque: el primer paso pendiente (o el resumen final)
      var nx = P.nextStep();
      if (nx) { block = nx.block; idx = nx.index; } else { block = C.blocks[C.blocks.length - 1]; idx = block.steps.length - 1; }
    } else {
      block = C.blocks[bi];
      idx = args[1] != null ? parseInt(args[1], 10) : -1;
      if (isNaN(idx) || idx < 0 || idx >= block.steps.length) {
        idx = 0;
        for (var i = 0; i < block.steps.length; i++) if (!P.stepDone(block, i)) { idx = i; break; }
      }
    }
    var step = block.steps[idx];
    if (step.kind !== "exercise") P.visit(block.id, idx);   // una pantalla de teoría vista cuenta como hecha

    var pos = C.blocks.indexOf(block);
    var stepperEl = stepper(block, idx);
    // Al resolver un ejercicio se refresca el indicador de pasos sin recargar la pantalla.
    var refresh = function () { var fresh = stepper(block, idx); stepperEl.replaceWith(fresh); stepperEl = fresh; };
    var view = h("div", null,
      h("header.page-header", null,
        h("p.eyebrow", null, "Bloque " + (pos + 1) + " de " + C.blocks.length + " · " + block.time + " min"),
        h("h1.title", { id: "page-title", tabindex: "-1" }, block.title),
        h("p.lead", null, block.goal)),
      stepperEl,
      h("div.step", null, stepBody(block, step, refresh)),
      L.state.get("facilitator", false) && block.facilitator
        ? h("details.fac", { open: "" }, h("summary", null, "Nota para el facilitador"), h("p", null, ui.rich(block.facilitator))) : null,
      nav(block, idx));
    return view;
  });

  function stepper(block, current) {
    return h("nav.stepper", { "aria-label": "Pasos del bloque" }, h("ol", null, block.steps.map(function (s, i) {
      var done = P.stepDone(block, i);
      var label = (s.kind === "exercise" ? "Ejercicio" : s.kind === "summary" ? "Resumen" : "Teoría") + " " + (i + 1) + (done ? " (hecho)" : "");
      return h("li", null, h("a.stepper__dot" + (i === current ? ".is-current" : "") + (done ? ".is-done" : ""),
        { href: "#/leccion/" + block.id + "/" + i, "aria-label": label, "aria-current": i === current ? "step" : false }, String(i + 1)));
    })));
  }

  function nav(block, idx) {
    var pos = C.blocks.indexOf(block), prev = null, next = null;
    if (idx > 0) prev = { href: "#/leccion/" + block.id + "/" + (idx - 1), label: "← Anterior" };
    else if (pos > 0) prev = { href: "#/leccion/" + C.blocks[pos - 1].id + "/" + (C.blocks[pos - 1].steps.length - 1), label: "← Bloque anterior" };
    if (idx < block.steps.length - 1) next = { href: "#/leccion/" + block.id + "/" + (idx + 1), label: "Siguiente →" };
    else if (pos < C.blocks.length - 1) next = { href: "#/leccion/" + C.blocks[pos + 1].id + "/0", label: "Siguiente bloque: " + C.blocks[pos + 1].title + " →" };
    return h("div.lnav", null,
      prev ? h("a.btn.btn--ghost", { href: prev.href }, prev.label) : h("span"),
      next ? h("a.btn", { href: next.href }, next.label) : h("a.btn", { href: "#/progreso" }, "Ver mi progreso →"));
  }

  function stepBody(block, step, onChange) {
    if (step.kind === "exercise") return L.exercises.render(C.exerciseById(step.id), { onChange: onChange });
    if (step.kind === "summary") return summary();
    // Teoría: composición editorial (texto + código) y, debajo, el simulador si lo hay.
    return h("div", null,
      h("div.split.split--theory", null,
        h("div", null, h("h2.section-title", null, ui.rich(step.title)), h("div.prose", null, step.body.map(function (t) { return h("p", null, ui.rich(t)); }))),
        step.code ? h("figure.fig", null, ui.code(step.code, { numbered: true }), step.caption ? h("figcaption.caption", null, ui.rich(step.caption)) : null) : null),
      step.sim ? h("div.sim-wrap", null, step.sim.type === "2d" ? L.sim.matrix2d(step.sim) : L.sim.array1d(step.sim)) : null,
      block.id === "b6" ? h("p.caption", null, "Para programar hay que iniciar LoWKie con su lanzador (Start-LoWKie).") : null);
  }

  /* ---------- Resumen ---------- */
  function summary() {
    var s = P.stats(), o = P.overall(), weak = P.weakTopics(), rec = P.recommend();
    return h("div", null,
      h("h2.section-title", null, "Resumen de la sesión"),
      h("dl.facts", null,
        fact(o.percent + "%", "de la unidad completada"),
        fact(s.completed + " / " + C.exercises.length, "ejercicios resueltos"),
        fact(s.correct + " / " + s.attempts, "aciertos / intentos"),
        fact(String(s.hints), "pistas usadas")),
      h("h3.sub", null, "Conceptos a reforzar"),
      weak.length
        ? h("ul.goals", null, weak.map(function (w) { return h("li", null, w.label + " — " + w.mistakes + (w.mistakes === 1 ? " fallo o solución vista" : " fallos o soluciones vistas")); }))
        : h("p", null, "No hay conceptos pendientes de reforzar. ¡Buen trabajo!"),
      L.ui.recoCard(rec));
  }
  function fact(big, small) { return h("div.fact", null, h("dd.fact__big", null, big), h("dt.fact__small", null, small)); }
})(window.LoWKie);
