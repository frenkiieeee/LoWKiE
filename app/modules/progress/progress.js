(function (L) {
  var h = L.ui.h, ui = L.ui, C = L.content, P = L.progress;

  function fact(big, small) { return h("div.fact", null, h("dd.fact__big", null, big), h("dt.fact__small", null, small)); }

  // Lista de ejercicios de una pista.
  function exerciseList(blocks) {
    var p = P.get(), ids = P.exerciseIds(blocks);
    return h("ol.rows", null, ids.map(function (id, i) {
      var e = C.exerciseById(id), done = P.isExerciseDone(id), assisted = p.revealed.indexOf(id) >= 0 && p.completed.indexOf(id) < 0, loc = P.locate(id);
      return h("li", null, h("span.rows__num", null, String(i + 1)),
        h("div", null, h("a.rows__title.rows__a", { href: loc ? P.routeToStep(loc) : "#/leccion" }, ui.rich(e.title)),
          h("p.rows__meta", null, C.topics[e.topic] + " · " + (p.attempts[id] || 0) + " intento(s) · " + (p.hints[id] || 0) + " pista(s)")),
        h("span.badge" + (done ? (assisted ? ".badge--todo" : ".badge--done") : ".badge--todo"), null, done ? (assisted ? "Con ayuda" : "Completado") : "Pendiente"));
    }));
  }
  function blockRows(blocks, offset) {
    return h("ol.rows", null, blocks.map(function (b, i) {
      var st = P.blockStatus(b), pct = Math.round(st.done * 100 / st.total);
      return h("li", null, h("span.rows__num", null, "0" + (i + 1)),
        h("div", null, h("a.rows__title.rows__a", { href: "#/leccion/" + b.id }, b.title), ui.progress(pct, "Progreso de " + b.title), h("p.rows__meta", null, st.done + " de " + st.total + " pasos")),
        h("span.caption", null, pct + "%"));
    }));
  }

  // Copia de seguridad del progreso: descargar y cargar (se fusiona, no se pierde nada).
  function backup() {
    var status = h("p.caption", { role: "status", "aria-live": "polite" }, "");
    var save = h("button.btn.btn--ghost", { type: "button" }, "Guardar copia de mi progreso");
    var fileIn = h("input", { type: "file", accept: "application/json,.json", id: "pg-file", class: "visually-hidden" });
    var load = h("label.btn.btn--ghost", { for: "pg-file", tabindex: "0" }, "Cargar una copia");
    load.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileIn.click(); } });
    save.addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(P.exportData(), null, 2)], { type: "application/json" });
      var a = h("a", { href: URL.createObjectURL(blob), download: "lowkie-progreso-" + new Date().toISOString().slice(0, 10) + ".json" });
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      status.textContent = "Copia guardada en tu carpeta de descargas.";
    });
    fileIn.addEventListener("change", function () {
      var f = fileIn.files && fileIn.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try { P.importData(JSON.parse(String(rd.result))); L.router.render(); }
        catch (e) { status.textContent = e instanceof SyntaxError ? "El archivo no es un JSON válido." : e.message; }
      };
      rd.readAsText(f);
    });
    return h("section", { "aria-labelledby": "bk-t" },
      ui.sectionHead("Copia de seguridad", null),
      h("p", { id: "bk-t" }, ui.rich("Tu progreso ya se guarda solo en este equipo. Si cambias de ordenador o de navegador, guarda una copia y cárgala allí: se **combina** con lo que ya tengas, sin borrar nada.")),
      h("div.sim__row", null, save, load, fileIn), status);
  }

  L.router.register("/progreso", "Progreso", function () {
    var base = C.blocks, adv = P.advBlocks(), o = P.overall(base), s = P.stats(base), oa = P.overall(adv), sa = P.stats(adv), weak = P.weakTopics();
    var reset = h("button.btn.btn--ghost", { type: "button" }, "Borrar mi progreso");
    reset.addEventListener("click", function () {
      ui.confirm("Borrar el progreso", "Se borrarán tus respuestas, intentos y pasos completados (también los de Avanzando). Tus proyectos de Code Space no se tocan. Si no estás seguro, guarda antes una copia.", "Borrar progreso")
        .then(function (yes) { if (yes) { P.reset(); L.router.render(); } });
    });
    var weakMap = {}; weak.forEach(function (w) { weakMap[w.topic] = w.mistakes; });

    return h("div", null,
      ui.pageHeader("Tu recorrido", "Progreso", "Lo que has completado, cómo te ha ido y qué conviene reforzar. Se guarda en este equipo."),
      h("dl.facts", null,
        fact(o.percent + "%", "de la unidad base"),
        fact(s.completed + " / " + s.total, "ejercicios resueltos"),
        fact(s.correct + " / " + s.attempts, "aciertos / intentos"),
        fact(String(s.hints), "pistas usadas")),

      h("section", null, ui.sectionHead("Unidad base · por bloques", null), blockRows(base)),

      h("section", null,
        ui.sectionHead("Avanzando", oa.percent + "% · " + sa.completed + " de " + sa.total + " ejercicios"),
        blockRows(adv), h("p.caption", null, h("a", { href: "#/avanzando" }, "Ir a Avanzando"))),

      h("section", null,
        ui.sectionHead("Conceptos", weak.length ? "ordenados por lo que más cuesta" : "sin fallos registrados"),
        h("ul.topics", null, Object.keys(C.topics).map(function (t) {
          var n = weakMap[t] || 0;
          return h("li", null, h("span", null, C.topics[t]), h("span.badge" + (n ? ".badge--current" : ".badge--done"), null, n ? n + (n === 1 ? " fallo" : " fallos") : "sin fallos"));
        }))),

      h("section", null, ui.sectionHead("Ejercicios de la unidad base", s.total + " en total"), exerciseList(base)),
      h("section", null, ui.sectionHead("Ejercicios de Avanzando", sa.total + " en total"), exerciseList(adv)),

      ui.recoCard(P.recommend()),
      backup(),
      h("div", null, reset));
  });
})(window.LoWKie);
