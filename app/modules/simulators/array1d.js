/* Simulador de arrays unidimensionales (spec §7.5). L.sim.array1d({values, name, panels}) → elemento DOM.
   panels: select · edit · resize · probe · traverse */
(function (L) {
  var h = L.ui.h, rich = L.ui.rich;
  var sim = (L.sim = L.sim || {});
  var MAX = 8;

  sim.array1d = function (opts) {
    var name = opts.name || "numeros";
    var panels = opts.panels || ["select", "edit", "resize", "probe", "traverse"];
    var has = function (p) { return panels.indexOf(p) >= 0; };
    var initial = opts.values.slice();
    var S = { values: initial.slice(), sel: null, probe: null, step: 0, steps: [], touched: null };
    var el = {};

    el.stage = h("div.arr", { role: "group", "aria-label": "Array " + name });
    el.length = h("p.sim__len");
    el.info = h("p.sim__info", { "aria-live": "polite" });
    var root = h("div.sim", null,
      h("div.sim__legend", null, h("span.lg.lg--idx", null, "índice (posición)"), h("span.lg.lg--val", null, "valor (contenido)"), h("span.lg.lg--len", null, "longitud (cuántos)")),
      el.stage, el.length);

    function cellButtons() { return el.stage.querySelectorAll(".cell"); }

    function draw() {
      var n = S.values.length;
      el.stage.replaceChildren();
      S.values.forEach(function (v, i) {
        var cls = "cell" + (S.sel === i ? " is-selected" : "") + (S.touched === i ? " is-touched" : "");
        var cur = traverseCurrent();
        if (cur === i) cls += " is-current";
        var b = h("button." + cls.split(" ").join("."), { type: "button", "aria-pressed": String(S.sel === i), "aria-label": "Posición " + i + ", valor " + v },
          h("span.cell__i", null, String(i)), h("span.cell__v", null, String(v)));
        b.addEventListener("click", function () { S.sel = i; S.probe = null; draw(); drawInfo(); if (el.editVal) { el.editVal.value = v; } });
        el.stage.appendChild(b);
      });
      el.length.replaceChildren(h("strong", null, name + ".length"), " = " + n + "  ·  índices válidos: 0 a " + (n - 1));
    }
    function drawInfo() {
      if (!el.info) return;
      if (S.sel == null) { el.info.textContent = "Pulsa una casilla para ver su índice y su valor."; return; }
      var i = S.sel;
      el.info.replaceChildren(h("code.inline", null, name + "[" + i + "]"), " vale ", h("strong", null, String(S.values[i])),
        ". Es el elemento número " + (i + 1) + ": el índice empieza en 0.");
    }

    /* ---- select ---- */
    if (has("select")) root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Seleccionar"), el.info));
    /* ---- edit ---- */
    if (has("edit")) {
      el.editVal = h("input.field", { type: "number", id: uid("v"), value: "0", "aria-label": "Nuevo valor" });
      el.editMsg = h("p.sim__code", { "aria-live": "polite" });
      var assign = h("button.btn.btn--sm", { type: "button" }, "Asignar");
      assign.addEventListener("click", function () {
        if (S.sel == null) { el.editMsg.textContent = "Primero elige una casilla."; return; }
        var v = parseInt(el.editVal.value, 10);
        if (isNaN(v)) { el.editMsg.textContent = "Escribe un número entero."; return; }
        S.values[S.sel] = v; S.touched = S.sel; draw(); drawInfo();
        el.editMsg.replaceChildren(h("code.inline", null, name + "[" + S.sel + "] = " + v + ";"), "  Solo cambia esa posición.");
      });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Modificar un valor"),
        h("div.sim__row", null, h("label", { for: el.editVal.id }, "Nuevo valor"), el.editVal, assign), el.editMsg));
    }
    /* ---- resize ---- */
    if (has("resize")) {
      el.len = h("input.field", { type: "number", id: uid("l"), min: "1", max: String(MAX), value: String(S.values.length), "aria-label": "Longitud" });
      el.resizeMsg = h("p.sim__code", { "aria-live": "polite" });
      var mk = h("button.btn.btn--sm", { type: "button" }, "Crear array vacío");
      var cp = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Copiar en otro de esta longitud");
      var reset = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Reiniciar ejemplo");
      var readLen = function () { var n = parseInt(el.len.value, 10); if (isNaN(n) || n < 1 || n > MAX) { el.resizeMsg.textContent = "Elige una longitud entre 1 y " + MAX + "."; return null; } return n; };
      mk.addEventListener("click", function () { var n = readLen(); if (!n) return; S.values = new Array(n).fill(0); S.sel = null; S.step = 0; draw(); drawInfo(); drawTraverse();
        el.resizeMsg.replaceChildren(h("code.inline", null, "int[] " + name + " = new int[" + n + "];"), "  Todas las posiciones valen 0.");
      });
      cp.addEventListener("click", function () { var n = readLen(); if (!n) return; var old = S.values; S.values = []; for (var i = 0; i < n; i++) S.values.push(i < old.length ? old[i] : 0); S.sel = null; draw(); drawInfo();
        el.resizeMsg.replaceChildren(rich("Un array **no puede crecer ni encogerse**: se crea uno nuevo de " + n + " posiciones y se copian los valores (" + (n < old.length ? "los que no caben se pierden" : "las posiciones nuevas valen 0") + ")."));
      });
      reset.addEventListener("click", function () { S.values = initial.slice(); S.sel = null; el.len.value = S.values.length; S.step = 0; draw(); drawInfo(); drawTraverse(); el.resizeMsg.textContent = ""; });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Tamaño fijo"),
        h("div.sim__row", null, h("label", { for: el.len.id }, "Longitud"), el.len, mk, cp, reset), el.resizeMsg));
    }
    /* ---- probe ---- */
    if (has("probe")) {
      el.probe = h("input.field", { type: "number", id: uid("p"), value: "4", "aria-label": "Índice a probar" });
      el.probeMsg = h("p.sim__result", { "aria-live": "polite", role: "status" });
      var go = h("button.btn.btn--sm", { type: "button" }, "Leer");
      var run = function () {
        var i = parseInt(el.probe.value, 10), n = S.values.length;
        if (isNaN(i)) { el.probeMsg.textContent = "Escribe un número entero."; el.probeMsg.className = "sim__result"; return; }
        S.touched = (i >= 0 && i < n) ? i : null; draw();
        if (i >= 0 && i < n) { el.probeMsg.className = "sim__result is-ok"; el.probeMsg.replaceChildren(h("code.inline", null, name + "[" + i + "]"), " → ", h("strong", null, String(S.values[i]))); }
        else { el.probeMsg.className = "sim__result is-error"; el.probeMsg.replaceChildren(h("strong", null, "ArrayIndexOutOfBoundsException: "), "Index " + i + " out of bounds for length " + n,
          h("br"), "Los índices válidos van de 0 a " + (n - 1) + "."); }
      };
      go.addEventListener("click", run);
      el.probe.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Probar un índice"),
        h("div.sim__row", null, h("label", { for: el.probe.id }, "Leer " + name + "["), el.probe, h("span", null, "]"), go), el.probeMsg));
    }
    /* ---- traverse ---- */
    var CODE = null;
    function buildSteps() {
      var v = S.values, n = v.length, out = [], steps = [{ line: 0, i: null, cond: null, msg: "Pulsa «Siguiente» para empezar el recorrido.", out: [] }];
      for (var i = 0; i < n; i++) {
        steps.push({ line: 1, i: i, cond: true, out: out.slice(), msg: (i === 0 ? "`i` empieza en 0. " : "`i` ahora vale " + i + ". ") + "¿" + i + " < " + n + "? **Sí**: entramos al bucle." });
        out.push(v[i]);
        steps.push({ line: 2, i: i, cond: true, out: out.slice(), msg: "Se imprime `" + name + "[" + i + "]` = **" + v[i] + "**." });
      }
      steps.push({ line: 1, i: n, cond: false, out: out.slice(), done: true, msg: "`i` vale " + n + ". ¿" + n + " < " + n + "? **No**: el bucle termina. Se han visitado todos los elementos." });
      return steps;
    }
    function traverseCurrent() { var s = S.steps[S.step]; return s && s.i != null && s.i < S.values.length && has("traverse") ? s.i : null; }
    function drawTraverse() {
      if (!has("traverse")) return;
      S.steps = buildSteps(); if (S.step >= S.steps.length) S.step = S.steps.length - 1;
      var s = S.steps[S.step];
      var src = "for (int i = 0; i < " + name + ".length; i++) {\n    System.out.println(" + name + "[i]);\n}";
      el.code.replaceChildren(L.ui.code(src, { numbered: true, active: s.line || undefined }));
      el.state.replaceChildren(
        row("i", s.i == null ? "—" : String(s.i)),
        row("i < " + name + ".length", s.cond == null ? "—" : (s.cond ? "true" : "false"), s.cond === false ? "is-bad" : ""),
        row(name + "[i]", s.i != null && s.i < S.values.length && s.line === 2 ? String(S.values[s.i]) : "—"),
        row("Salida", s.out.length ? s.out.join("  ") : "(vacía)"));
      el.tmsg.replaceChildren(rich(s.msg));
      el.prev.disabled = S.step === 0; el.next.disabled = S.step === S.steps.length - 1;
      el.counter.textContent = "Paso " + S.step + " de " + (S.steps.length - 1);
      draw();
    }
    function row(k, v, cls) { return h("div.kv" + (cls ? "." + cls : ""), null, h("dt", null, k), h("dd", null, v)); }
    if (has("traverse")) {
      el.code = h("div"); el.state = h("dl.kvs"); el.tmsg = h("p.sim__info", { "aria-live": "polite" }); el.counter = h("span.caption");
      el.prev = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "← Anterior");
      el.next = h("button.btn.btn--sm", { type: "button" }, "Siguiente →");
      el.restart = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Reiniciar");
      el.prev.addEventListener("click", function () { S.step = Math.max(0, S.step - 1); drawTraverse(); });
      el.next.addEventListener("click", function () { S.step = Math.min(S.steps.length - 1, S.step + 1); drawTraverse(); });
      el.restart.addEventListener("click", function () { S.step = 0; drawTraverse(); });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Recorrido paso a paso"),
        h("div.sim__trace", null, el.code, el.state), el.tmsg, h("div.sim__row", null, el.restart, el.prev, el.next, el.counter)));
    }

    draw(); drawInfo(); drawTraverse();
    return root;
  };

  var n = 0; function uid(p) { return "sim-" + p + "-" + (++n); }
  sim._uid = uid;
})(window.LoWKie = window.LoWKie || {});
