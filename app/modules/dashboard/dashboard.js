(function (L) {
  var h = L.ui.h, ui = L.ui, C = L.content, P = L.progress;
  var STATE_LABEL = { done: "Completado", current: "En curso", todo: "Pendiente" };

  L.router.register("/inicio", "Inicio", function () {
    var o = P.overall(), nx = P.nextStep(), rec = P.recommend(), started = o.done > 0;
    P.shown(rec.id);
    return h("div", null,
      L.api.available ? null : ui.startCard("Estás en modo lectura"),
      h("header.page-header", null,
        h("p.eyebrow", null, (started ? "Hola de nuevo" : "Hola") + " · Unidad 01"),
        h("h1.display", { id: "page-title", tabindex: "-1" }, C.unit.title),
        h("p.lead", null, C.unit.summary),
        h("div", { style: "margin-top:var(--space-4)" },
          nx ? ui.button((started ? "Continuar: " : "Empezar: ") + nx.block.title, P.routeToStep(nx)) : ui.button("Repasar la unidad", "#/aprendizaje"))),

      h("div.split", null,
        h("section", { "aria-labelledby": "sesion" },
          h("div.section-head", null,
            h("h2.section-title", { id: "sesion" }, "Tu sesión de 90 minutos"),
            h("a.caption", { href: "#/aprendizaje" }, "Ver ruta completa")),
          h("ol.rows", null, C.blocks.map(function (b, i) {
            var st = P.blockStatus(b), state = P.blockState(b);
            return h("li", null,
              h("span.rows__num", null, "0" + (i + 1)),
              h("div", null,
                h("a.rows__title.rows__a", { href: "#/leccion/" + b.id }, b.title),
                h("p.rows__meta", null, b.time + " min · " + b.goal)),
              h("span.badge.badge--" + state, null, STATE_LABEL[state]));
          }))),

        h("aside", { style: "display:grid;gap:var(--space-7)" },
          h("div.bignum", null,
            h("p.eyebrow", null, "Progreso de la sesión"),
            h("p.bignum__value", { "aria-label": o.percent + " por ciento" }, String(o.percent), h("small", null, "%")),
            ui.progress(o.percent, "Progreso de la sesión"),
            h("p.caption", null, o.done + " de " + o.total + " pasos completados")),
          ui.recoCard(rec))),

      h("section", { "aria-labelledby": "obj" },
        h("div.section-head", null, h("h2.section-title", { id: "obj" }, "Objetivos de la unidad")),
        h("ul.goals", null, C.unit.goals.map(function (g) { return h("li", null, g); }))));
  });
})(window.LoWKie);
