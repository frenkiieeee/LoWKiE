(function (L) {
  var h = L.ui.h, ui = L.ui, C = L.content, P = L.progress;

  L.router.register("/progreso", "Progreso", function () {
    var o = P.overall(), s = P.stats(), weak = P.weakTopics(), p = P.get();
    var reset = h("button.btn.btn--ghost", { type: "button" }, "Borrar mi progreso");
    reset.addEventListener("click", function () {
      ui.confirm("Borrar el progreso", "Se borrarán tus respuestas, intentos y pasos completados. Tus proyectos de Code Space no se tocan.", "Borrar progreso")
        .then(function (yes) { if (yes) { P.reset(); L.router.render(); } });
    });
    var weakMap = {}; weak.forEach(function (w) { weakMap[w.topic] = w.mistakes; });

    return h("div", null,
      ui.pageHeader("Tu recorrido", "Progreso", "Lo que has completado, cómo te ha ido y qué conviene reforzar. Se guarda en este equipo."),
      h("dl.facts", null,
        fact(o.percent + "%", "de la unidad"),
        fact(s.completed + " / " + C.exercises.length, "ejercicios resueltos"),
        fact(s.correct + " / " + s.attempts, "aciertos / intentos"),
        fact(String(s.hints), "pistas usadas")),

      h("section", { "aria-labelledby": "p-bloques" },
        ui.sectionHead("Por bloques", null),
        h("ol.rows", null, C.blocks.map(function (b, i) {
          var st = P.blockStatus(b), pct = Math.round(st.done * 100 / st.total);
          return h("li", null, h("span.rows__num", null, "0" + (i + 1)),
            h("div", null, h("a.rows__title.rows__a", { href: "#/leccion/" + b.id }, b.title), ui.progress(pct, "Progreso de " + b.title), h("p.rows__meta", null, st.done + " de " + st.total + " pasos")),
            h("span.caption", null, pct + "%"));
        }))),

      h("section", null,
        ui.sectionHead("Conceptos", weak.length ? "ordenados por lo que más cuesta" : "sin fallos registrados"),
        h("ul.topics", null, Object.keys(C.topics).map(function (t) {
          var n = weakMap[t] || 0;
          return h("li", null, h("span", null, C.topics[t]), h("span.badge" + (n ? ".badge--current" : ".badge--done"), null, n ? n + (n === 1 ? " fallo" : " fallos") : "sin fallos"));
        }))),

      h("section", null,
        ui.sectionHead("Ejercicios", C.exercises.length + " en total"),
        h("ol.rows", null, C.exercises.map(function (e, i) {
          var done = P.isExerciseDone(e.id), assisted = p.revealed.indexOf(e.id) >= 0 && p.completed.indexOf(e.id) < 0;
          var loc = P.locate(e.id);
          return h("li", null, h("span.rows__num", null, String(i + 1)),
            h("div", null, h("a.rows__title.rows__a", { href: loc ? P.routeToStep(loc) : "#/leccion" }, ui.rich(e.title)),
              h("p.rows__meta", null, C.topics[e.topic] + " · " + (p.attempts[e.id] || 0) + " intento(s) · " + (p.hints[e.id] || 0) + " pista(s)")),
            h("span.badge" + (done ? (assisted ? ".badge--todo" : ".badge--done") : ".badge--todo"), null, done ? (assisted ? "Con ayuda" : "Completado") : "Pendiente"));
        }))),

      ui.recoCard(P.recommend()),
      h("div", null, reset));
  });
  function fact(big, small) { return h("div.fact", null, h("dd.fact__big", null, big), h("dt.fact__small", null, small)); }
})(window.LoWKie);
