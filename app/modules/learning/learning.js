/* Ruta de aprendizaje, Learning Space (reproductor de lecciones) y «Avanzando». */
(function (L) {
  var h = L.ui.h, ui = L.ui, C = L.content, P = L.progress;
  var STATE_LABEL = { done: "Completado", current: "En curso", todo: "Pendiente" };

  function blockById(id) { var all = P.allBlocks(); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }
  function badge(state) { return h("span.badge.badge--" + state, null, STATE_LABEL[state]); }
  function isAdv(block) { return P.trackOf(block) !== C.blocks; }

  /* ---------- Ruta ---------- */
  L.router.register("/aprendizaje", "Ruta de aprendizaje", function () {
    var nx = P.nextStep();
    return h("div", null,
      ui.pageHeader("Unidad 01 · " + C.unit.title, "Ruta de aprendizaje",
        "Siete bloques para una sesión de 90 minutos. Puedes entrar en cualquiera: el profesor puede detenerse, repetir o saltar actividades."),
      nx ? h("div", null, ui.button("Continuar: " + nx.block.title, P.routeToStep(nx))) : h("p.lead", null, "Has completado toda la unidad base. ¿Sigues avanzando?"),
      nx ? null : h("div", null, ui.button("Ir a Avanzando", "#/avanzando")),
      h("ol.rows.rows--link", null, C.blocks.map(function (b, i) {
        var st = P.blockStatus(b), state = P.blockState(b);
        return h("li", null,
          h("span.rows__num", null, "0" + (i + 1)),
          h("div", null,
            h("a.rows__title.rows__a", { href: "#/leccion/" + b.id }, b.title),
            h("p.rows__meta", null, b.time + " min · " + b.goal + " · " + st.done + "/" + st.total + " pasos")),
          badge(state));
      })),
      h("p.caption", null, "Cuando termines: ", h("a", { href: "#/avanzando" }, "Avanzando"), " amplía esta unidad con patrones, copias, ordenación, métodos y consejos."));
  });

  /* ---------- Lección ---------- */
  L.router.register("/leccion", "Lección actual", function (args) {
    var block = args[0] ? blockById(args[0]) : null, idx;
    if (!block) {   // sin bloque: el primer paso pendiente (base → Avanzando) o el resumen final
      var nx = P.nextStep() || P.nextStep(P.advBlocks());
      if (nx) { block = nx.block; idx = nx.index; } else { block = C.blocks[C.blocks.length - 1]; idx = block.steps.length - 1; }
    } else {
      idx = args[1] != null ? parseInt(args[1], 10) : -1;
      if (isNaN(idx) || idx < 0 || idx >= block.steps.length) {
        idx = 0;
        for (var i = 0; i < block.steps.length; i++) if (!P.stepDone(block, i)) { idx = i; break; }
      }
    }
    var step = block.steps[idx], track = P.trackOf(block), pos = track.indexOf(block), adv = isAdv(block);
    if (step.kind !== "exercise") P.visit(block.id, idx);   // una pantalla de teoría vista cuenta como hecha

    var stepperEl = stepper(block, idx);
    // Al resolver un ejercicio se refresca el indicador de pasos sin recargar la pantalla.
    var refresh = function () { var fresh = stepper(block, idx); stepperEl.replaceWith(fresh); stepperEl = fresh; };
    return h("div", null,
      h("header.page-header", null,
        h("p.eyebrow", null, adv ? "Avanzando · módulo " + (pos + 1) + " de " + track.length + " · ~" + block.minutes + " min"
                                 : "Bloque " + (pos + 1) + " de " + track.length + " · " + block.time + " min"),
        h("h1.title", { id: "page-title", tabindex: "-1" }, block.title),
        h("p.lead", null, block.goal),
        step.section ? h("p.crumb", null, block.title + " › ", h("strong", null, step.section)) : null),
      stepperEl,
      h("div.step", null, stepBody(block, step, refresh)),
      L.state.get("facilitator", false) && block.facilitator
        ? h("details.fac", { open: "" }, h("summary", null, "Nota para el facilitador"), h("p", null, ui.rich(block.facilitator))) : null,
      nav(block, idx));
  });

  function stepper(block, current) {
    return h("nav.stepper", { "aria-label": "Pasos del bloque" }, h("ol", null, block.steps.map(function (s, i) {
      var done = P.stepDone(block, i);
      var label = (s.kind === "exercise" ? "Ejercicio" : s.kind === "summary" ? "Resumen" : "Teoría") + " " + (i + 1) + (s.section ? " · " + s.section : "") + (done ? " (hecho)" : "");
      return h("li", null, h("a.stepper__dot" + (i === current ? ".is-current" : "") + (done ? ".is-done" : ""),
        { href: "#/leccion/" + block.id + "/" + i, "aria-label": label, title: s.section || null, "aria-current": i === current ? "step" : false }, String(i + 1)));
    })));
  }

  function nav(block, idx) {
    var track = P.trackOf(block), pos = track.indexOf(block), adv = isAdv(block), prev = null, next = null;
    if (idx > 0) prev = { href: "#/leccion/" + block.id + "/" + (idx - 1), label: "← Anterior" };
    else if (pos > 0) prev = { href: "#/leccion/" + track[pos - 1].id + "/" + (track[pos - 1].steps.length - 1), label: "← Bloque anterior" };
    else if (adv) prev = { href: "#/avanzando", label: "← Avanzando" };
    if (idx < block.steps.length - 1) next = { href: "#/leccion/" + block.id + "/" + (idx + 1), label: "Siguiente →" };
    else if (pos < track.length - 1) next = { href: "#/leccion/" + track[pos + 1].id + "/0", label: "Siguiente bloque: " + track[pos + 1].title + " →" };
    else if (!adv) next = { href: "#/avanzando", label: "Seguir avanzando →" };
    return h("div.lnav", null,
      prev ? h("a.btn.btn--ghost", { href: prev.href }, prev.label) : h("span"),
      next ? h("a.btn", { href: next.href }, next.label) : h("a.btn", { href: "#/progreso" }, "Ver mi progreso →"));
  }

  function tipBox(text) {
    return h("aside.tip", { "aria-label": "Consejo" }, h("span.tip__t", null, "Consejo"), h("p", null, ui.rich(text)));
  }

  function stepBody(block, step, onChange) {
    if (step.kind === "exercise") return L.exercises.render(C.exerciseById(step.id), { onChange: onChange });
    if (step.kind === "summary") return summary(block);
    // Teoría: composición editorial (texto + código) y, debajo, el simulador si lo hay.
    return h("div", null,
      h("div.split.split--theory", null,
        h("div", null, h("h2.section-title", null, ui.rich(step.title)), h("div.prose", null, step.body.map(function (t) { return h("p", null, ui.rich(t)); }), step.tip ? tipBox(step.tip) : null)),
        step.code ? h("figure.fig", null, ui.code(step.code, { numbered: true }), step.caption ? h("figcaption.caption", null, ui.rich(step.caption)) : null) : null),
      step.sim ? h("div.sim-wrap", null, L.sim.build(step.sim)) : null,
      block.id === "b6" ? h("p.caption", null, "Para programar hay que iniciar LoWKie con su lanzador (Start-LoWKie).") : null);
  }

  /* ---------- Resumen (de la pista a la que pertenece el bloque) ---------- */
  function summary(block) {
    var adv = isAdv(block), blocks = P.trackOf(block);
    var s = P.stats(blocks), o = P.overall(blocks), weak = P.weakTopics(), rec = P.recommend();
    var ids = P.exerciseIds(blocks);
    var mine = Object.keys(C.topics).filter(function (t) { return C.exercises.some(function (e) { return e.topic === t && ids.indexOf(e.id) >= 0; }); });
    weak = weak.filter(function (w) { return mine.indexOf(w.topic) >= 0; });   // solo conceptos de esta pista
    return h("div", null,
      h("h2.section-title", null, adv ? "Resumen de Avanzando" : "Resumen de la sesión"),
      h("dl.facts", null,
        fact(o.percent + "%", adv ? "de Avanzando" : "de la unidad completada"),
        fact(s.completed + " / " + s.total, "ejercicios resueltos"),
        fact(s.correct + " / " + s.attempts, "aciertos / intentos"),
        fact(String(s.hints), "pistas usadas")),
      adv ? h("div", null, h("h3.sub", null, "Lo que te llevas"), h("ul.goals", null, C.advanced.takeaways.map(function (t) { return h("li", null, ui.rich(t)); }))) : null,
      h("h3.sub", null, "Conceptos a reforzar"),
      weak.length
        ? h("ul.goals", null, weak.map(function (w) { return h("li", null, w.label + " — " + w.mistakes + (w.mistakes === 1 ? " fallo o solución vista" : " fallos o soluciones vistas")); }))
        : h("p", null, "No hay conceptos pendientes de reforzar. ¡Buen trabajo!"),
      L.ui.recoCard(rec));
  }
  function fact(big, small) { return h("div.fact", null, h("dd.fact__big", null, big), h("dt.fact__small", null, small)); }

  /* ---------- Avanzando: módulos › temas › pasos ---------- */
  L.router.register("/avanzando", "Avanzando", function () {
    var A = C.advanced, blocks = A.blocks, o = P.overall(blocks), nx = P.nextStep(blocks), baseDone = !P.nextStep(), tips = [];
    var tree = blocks.map(function (b, bi) {
      var st = P.blockStatus(b), state = P.blockState(b), groups = [];
      b.steps.forEach(function (s, i) {   // agrupa los pasos consecutivos por tema (section)
        if (s.kind === "theory" && s.tip) tips.push({ block: b, section: s.section, tip: s.tip, index: i });
        var last = groups[groups.length - 1];
        if (!last || last.title !== s.section) { last = { title: s.section, first: i, steps: [] }; groups.push(last); }
        last.steps.push(i);
      });
      return h("section.module", { "aria-labelledby": "mod-" + b.id },
        h("div.module__head", null,
          h("h2.module__t", { id: "mod-" + b.id }, h("span.rows__num", null, "0" + (bi + 1) + "  "), h("a", { href: "#/leccion/" + b.id }, b.title)),
          badge(state)),
        h("p.rows__meta", null, b.goal + " · ~" + b.minutes + " min · " + st.done + "/" + st.total + " pasos"),
        ui.progress(Math.round(st.done * 100 / st.total), "Progreso de " + b.title),
        h("ul.sections", null, groups.map(function (g) {
          var done = g.steps.filter(function (i) { return P.stepDone(b, i); }).length;
          var cls = done === g.steps.length ? ".is-done" : done ? ".is-part" : "";
          return h("li", null, h("span.dot" + cls, { "aria-hidden": "true" }), h("a", { href: "#/leccion/" + b.id + "/" + g.first }, g.title));
        })));
    });
    var last = blocks[blocks.length - 1];
    return h("div", null,
      ui.pageHeader("Unidad 01 · segunda parte", A.title, A.summary),
      baseDone ? null : h("p.fb.fb--info", null, ui.rich(A.prerequisite)),
      h("div.bignum", { style: "max-width:20rem" },
        h("p.eyebrow", null, "Tu avance en Avanzando"),
        h("p.bignum__value", { "aria-label": o.percent + " por ciento" }, String(o.percent), h("small", null, "%")),
        ui.progress(o.percent, "Progreso de Avanzando")),
      h("div", null, nx ? ui.button((o.done ? "Continuar: " : "Empezar: ") + nx.block.title, P.routeToStep(nx)) : ui.button("Ver mi resumen", "#/leccion/" + last.id + "/" + (last.steps.length - 1))),
      h("div.modules", null, tree),
      h("section", { "aria-labelledby": "tips-t" },
        h("div.section-head", null, h("h2.section-title", { id: "tips-t" }, "Todos los consejos"), h("span.caption", null, tips.length + " consejos")),
        h("ul.tipsall", null, tips.map(function (t) {
          return h("li", null, h("span.caption", null, t.block.title + " › " + t.section), h("p", null, ui.rich(t.tip)), h("a.caption", { href: "#/leccion/" + t.block.id + "/" + t.index }, "Ver el tema"));
        }))));
  });
})(window.LoWKie);
