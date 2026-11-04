/* Simulador de ordenación (burbuja) paso a paso. L.sim.sortBubble({values, name}) → elemento DOM. */
(function (L) {
  var h = L.ui.h, rich = L.ui.rich;

  L.sim.sortBubble = function (opts) {
    var name = opts.name || "a";
    var initial = opts.values.slice();
    var S = { start: initial.slice(), steps: [], step: 0 };
    var el = {};

    // Genera todos los pasos de la burbuja (cada uno con una foto del array).
    function build(values) {
      var a = values.slice(), n = a.length, steps = [{ arr: a.slice(), line: 0, cmp: null, swapped: false, sortedFrom: n, msg: "Pulsa «Siguiente» para empezar. La burbuja compara parejas vecinas." }];
      var sortedFrom = n;
      for (var i = 0; i < n - 1; i++) {
        for (var j = 0; j < n - 1 - i; j++) {
          var gt = a[j] > a[j + 1];
          steps.push({ arr: a.slice(), line: 3, cmp: [j, j + 1], swapped: false, sortedFrom: sortedFrom,
            msg: "Pasada " + (i + 1) + ". ¿`" + name + "[" + j + "] > " + name + "[" + (j + 1) + "]`? ¿" + a[j] + " > " + a[j + 1] + "? **" + (gt ? "Sí" : "No") + "**" + (gt ? ": hay que intercambiarlos." : ": ya están bien.") });
          if (gt) {
            var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
            steps.push({ arr: a.slice(), line: 4, cmp: [j, j + 1], swapped: true, sortedFrom: sortedFrom, msg: "Se intercambian: ahora `" + name + "[" + j + "]` = " + a[j] + " y `" + name + "[" + (j + 1) + "]` = " + a[j + 1] + "." });
          }
        }
        sortedFrom = n - 1 - i;
        steps.push({ arr: a.slice(), line: 2, cmp: null, swapped: false, sortedFrom: sortedFrom, msg: "Fin de la pasada " + (i + 1) + ": el **" + a[n - 1 - i] + "** ya está en su sitio definitivo." });
      }
      steps.push({ arr: a.slice(), line: 0, cmp: null, swapped: false, sortedFrom: 0, done: true, msg: "**Ordenado:** " + a.join(", ") + ". Con " + n + " elementos la burbuja hizo como mucho " + (n * (n - 1) / 2) + " comparaciones." });
      return steps;
    }

    el.stage = h("div.arr", { role: "group", "aria-label": "Array en ordenación" });
    el.info = h("p.sim__info", { "aria-live": "polite" });
    el.counter = h("span.caption");
    el.code = h("div");
    el.prev = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "← Anterior");
    el.next = h("button.btn.btn--sm", { type: "button" }, "Siguiente →");
    var restart = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Reiniciar");
    var shuffle = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Mezclar otro array");
    var src = "for (int i = 0; i < a.length - 1; i++) {\n    for (int j = 0; j < a.length - 1 - i; j++) {\n        if (a[j] > a[j + 1]) {\n            int temp = a[j]; a[j] = a[j + 1]; a[j + 1] = temp;\n        }\n    }\n}".replace(/\ba\b/g, name);

    function draw() {
      var s = S.steps[S.step];
      el.stage.replaceChildren();
      s.arr.forEach(function (v, i) {
        var cls = "cell" + (s.cmp && (i === s.cmp[0] || i === s.cmp[1]) ? (s.swapped ? " is-touched is-current" : " is-selected") : "") + (i >= s.sortedFrom ? " is-sorted" : "");
        el.stage.appendChild(h("button." + cls.split(" ").join("."), { type: "button", tabindex: "-1", "aria-label": "Posición " + i + ", valor " + v + (i >= s.sortedFrom ? ", ya ordenado" : "") },
          h("span.cell__i", null, String(i)), h("span.cell__v", null, String(v))));
      });
      el.code.replaceChildren(L.ui.code(src, { numbered: true, active: s.line || undefined }));
      el.info.replaceChildren(rich(s.msg));
      el.prev.disabled = S.step === 0; el.next.disabled = S.step === S.steps.length - 1;
      el.counter.textContent = "Paso " + S.step + " de " + (S.steps.length - 1);
    }
    function load(values) { S.start = values.slice(); S.steps = build(values); S.step = 0; draw(); }

    el.prev.addEventListener("click", function () { S.step = Math.max(0, S.step - 1); draw(); });
    el.next.addEventListener("click", function () { S.step = Math.min(S.steps.length - 1, S.step + 1); draw(); });
    restart.addEventListener("click", function () { S.step = 0; draw(); });
    shuffle.addEventListener("click", function () {
      var pool = [1, 2, 3, 4, 5, 6, 7, 8, 9], n = initial.length, out = [];
      while (out.length < n) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      load(out);
    });

    var root = h("div.sim", null,
      h("div.sim__legend", null, h("span.lg.lg--idx", null, "índice"), h("span.lg.lg--val", null, "valor"), h("span.lg.lg--len", null, "ya ordenado (al final)")),
      el.stage,
      h("div.sim__panel", null, h("h4.sim__h", null, "Burbuja paso a paso"),
        h("div.sim__trace", null, el.code, h("div")), el.info,
        h("div.sim__row", null, restart, el.prev, el.next, shuffle, el.counter)));
    load(initial);
    return root;
  };
})(window.LoWKie = window.LoWKie || {});
