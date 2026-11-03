/* Simulador de matrices (spec §7.6). L.sim.matrix2d({values, name, panels}) → elemento DOM.
   Admite filas de longitudes distintas (arrays de arrays). panels: select · edit · resize · traverse */
(function (L) {
  var h = L.ui.h, rich = L.ui.rich, uid = function (p) { return L.sim._uid(p); };
  var MAXD = 6;

  L.sim.matrix2d = function (opts) {
    var name = opts.name || "matriz";
    var panels = opts.panels || ["select", "edit", "resize", "traverse"];
    var has = function (p) { return panels.indexOf(p) >= 0; };
    var copy = function (m) { return m.map(function (r) { return r.slice(); }); };
    var initial = copy(opts.values);
    var S = { m: copy(initial), sel: null, step: 0, steps: [], touched: null };
    var el = {};

    el.grid = h("div.mgrid");
    el.dims = h("p.sim__len");
    el.info = h("p.sim__info", { "aria-live": "polite" });
    var root = h("div.sim", null,
      h("div.sim__legend", null, h("span.lg.lg--row", null, "fila (hacia abajo)"), h("span.lg.lg--col", null, "columna (hacia la derecha)"), h("span.lg.lg--val", null, "valor")),
      el.grid, el.dims);

    function maxCols() { return S.m.reduce(function (a, r) { return Math.max(a, r.length); }, 0); }
    function cur() { var s = S.steps[S.step]; return has("traverse") && s && s.f != null ? s : null; }

    function draw() {
      var cols = maxCols(), t = cur();
      var table = h("table.mt", { role: "grid", "aria-label": "Matriz " + name });
      var head = h("tr", null, h("th.mt__corner", { scope: "col" }, ""));
      for (var c = 0; c < cols; c++) head.appendChild(h("th.mt__ch" + (S.sel && S.sel.c === c || (t && t.c === c) ? ".is-hot" : ""), { scope: "col" }, String(c)));
      table.appendChild(h("thead", null, head));
      var body = h("tbody");
      S.m.forEach(function (row, f) {
        var tr = h("tr" + ((S.sel && S.sel.f === f) || (t && t.f === f) ? ".is-hotrow" : ""), null,
          h("th.mt__rh" + ((S.sel && S.sel.f === f) || (t && t.f === f) ? ".is-hot" : ""), { scope: "row" }, String(f)));
        for (var c = 0; c < cols; c++) {
          if (c >= row.length) { tr.appendChild(h("td.mt__none", { "aria-label": "No existe" }, "")); continue; }
          var cls = "mcell" + (S.sel && S.sel.f === f && S.sel.c === c ? " is-selected" : "") + (S.touched && S.touched.f === f && S.touched.c === c ? " is-touched" : "");
          if (t && t.f === f && t.c === c) cls += " is-current";
          else if (t && t.visited && t.visited[f + "," + c]) cls += " is-visited";
          var b = h("button." + cls.split(" ").join("."), { type: "button", "aria-label": "Fila " + f + ", columna " + c + ", valor " + row[c], "aria-pressed": String(!!(S.sel && S.sel.f === f && S.sel.c === c)) }, String(row[c]));
          (function (f2, c2) { b.addEventListener("click", function () { S.sel = { f: f2, c: c2 }; draw(); drawInfo(); if (el.editVal) el.editVal.value = S.m[f2][c2]; }); })(f, c);
          tr.appendChild(h("td", null, b));
        }
        body.appendChild(tr);
      });
      table.appendChild(body);
      el.grid.replaceChildren(table);
      var irregular = S.m.some(function (r) { return r.length !== S.m[0].length; });
      el.dims.replaceChildren(h("strong", null, name + ".length"), " = " + S.m.length + " filas  ·  ",
        irregular ? "las filas tienen longitudes distintas (matriz irregular)" : h("span", null, h("strong", null, name + "[0].length"), " = " + S.m[0].length + " columnas"));
    }
    function drawInfo() {
      if (S.sel == null) { el.info.textContent = "Pulsa una celda para ver sus dos índices."; return; }
      var f = S.sel.f, c = S.sel.c;
      el.info.replaceChildren(h("code.inline.mx", null, name + "[", h("span.t-row", null, String(f)), "][", h("span.t-col", null, String(c)), "]"), " vale ",
        h("strong", null, String(S.m[f][c])), ". Es la ", h("span.t-row", null, "fila " + f), " y la ", h("span.t-col", null, "columna " + c), ".");
    }

    if (has("select")) {
      var explain = h("p.sim__formula", { "aria-label": "Cómo se lee matriz[fila][columna]" }, h("code.inline.mx", null, name + "[", h("span.t-row", null, "fila"), "][", h("span.t-col", null, "columna"), "]"),
        "  →  primero la ", h("span.t-row", null, "fila"), ", después la ", h("span.t-col", null, "columna"), ".");
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Seleccionar"), explain, el.info));
    }
    if (has("edit")) {
      el.editVal = h("input.field", { type: "number", id: uid("mv"), value: "0", "aria-label": "Nuevo valor" });
      el.editMsg = h("p.sim__code", { "aria-live": "polite" });
      var assign = h("button.btn.btn--sm", { type: "button" }, "Asignar");
      assign.addEventListener("click", function () {
        if (!S.sel) { el.editMsg.textContent = "Primero elige una celda."; return; }
        var v = parseInt(el.editVal.value, 10);
        if (isNaN(v)) { el.editMsg.textContent = "Escribe un número entero."; return; }
        S.m[S.sel.f][S.sel.c] = v; S.touched = { f: S.sel.f, c: S.sel.c }; draw(); drawInfo();
        el.editMsg.replaceChildren(h("code.inline", null, name + "[" + S.sel.f + "][" + S.sel.c + "] = " + v + ";"));
      });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Modificar una celda"),
        h("div.sim__row", null, h("label", { for: el.editVal.id }, "Nuevo valor"), el.editVal, assign), el.editMsg));
    }
    if (has("resize")) {
      el.rows = h("input.field", { type: "number", id: uid("r"), min: "1", max: String(MAXD), value: String(S.m.length), "aria-label": "Filas" });
      el.cols = h("input.field", { type: "number", id: uid("c"), min: "1", max: String(MAXD), value: String(S.m[0].length), "aria-label": "Columnas" });
      el.rmsg = h("p.sim__code", { "aria-live": "polite" });
      var mk = h("button.btn.btn--sm", { type: "button" }, "Crear matriz");
      var irr = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Ejemplo irregular");
      var reset = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Reiniciar ejemplo");
      mk.addEventListener("click", function () {
        var r = parseInt(el.rows.value, 10), c = parseInt(el.cols.value, 10);
        if (isNaN(r) || isNaN(c) || r < 1 || c < 1 || r > MAXD || c > MAXD) { el.rmsg.textContent = "Elige entre 1 y " + MAXD + " filas y columnas."; return; }
        S.m = []; for (var i = 0; i < r; i++) S.m.push(new Array(c).fill(0)); S.sel = null; S.step = 0; refresh();
        el.rmsg.replaceChildren(h("code.inline", null, "int[][] " + name + " = new int[" + r + "][" + c + "];"), "  Todas las celdas valen 0.");
      });
      irr.addEventListener("click", function () { S.m = [[1], [2, 3], [4, 5, 6]]; S.sel = null; S.step = 0; refresh();
        el.rmsg.replaceChildren(rich("Cada fila es un array propio: aquí miden **1**, **2** y **3**. `" + name + "[2].length` es 3 y `" + name + "[0].length` es 1.")); });
      reset.addEventListener("click", function () { S.m = copy(initial); S.sel = null; S.step = 0; refresh(); el.rmsg.textContent = ""; });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Crear otra matriz"),
        h("div.sim__row", null, h("label", { for: el.rows.id }, "Filas"), el.rows, h("label", { for: el.cols.id }, "Columnas"), el.cols, mk, irr, reset), el.rmsg));
    }

    /* ---- recorrido con bucles anidados ---- */
    function buildSteps() {
      var m = S.m, nf = m.length, steps = [{ line: 0, f: null, c: null, msg: "Pulsa «Siguiente» para empezar el recorrido.", out: "", visited: {} }];
      var out = "", visited = {};
      for (var f = 0; f < nf; f++) {
        var nc = m[f].length;
        steps.push({ line: 1, f: f, c: null, vars: { fila: f, columna: "—" }, cond: [true, f + " < " + nf], out: out, visited: copyObj(visited), msg: "Bucle **externo**: `fila` = " + f + ". ¿" + f + " < " + nf + "? **Sí**: empieza la fila " + f + "." });
        for (var c = 0; c < nc; c++) {
          steps.push({ line: 2, f: f, c: c, vars: { fila: f, columna: c }, cond: [true, c + " < " + nc], out: out, visited: copyObj(visited), msg: "Bucle **interno**: `columna` = " + c + ". ¿" + c + " < " + nc + "? **Sí**." });
          out += m[f][c] + " "; visited[f + "," + c] = true;
          steps.push({ line: 3, f: f, c: c, vars: { fila: f, columna: c }, cond: [true, ""], out: out, visited: copyObj(visited), msg: "Se imprime `" + name + "[" + f + "][" + c + "]` = **" + m[f][c] + "**." });
        }
        steps.push({ line: 2, f: f, c: nc, vars: { fila: f, columna: nc }, cond: [false, nc + " < " + nc], out: out, visited: copyObj(visited), msg: "`columna` = " + nc + ". ¿" + nc + " < " + nc + "? **No**: el bucle interno termina (la fila " + f + " está completa)." });
        out += "\n";
        steps.push({ line: 5, f: f, c: null, vars: { fila: f, columna: "—" }, cond: [true, ""], out: out, visited: copyObj(visited), msg: "`println()` baja a la línea siguiente. Ahora `fila++`." });
      }
      steps.push({ line: 1, f: nf, c: null, vars: { fila: nf, columna: "—" }, cond: [false, nf + " < " + nf], out: out, visited: copyObj(visited), done: true, msg: "`fila` = " + nf + ". ¿" + nf + " < " + nf + "? **No**: el bucle externo termina. Se recorrieron todas las celdas." });
      return steps;
    }
    function copyObj(o) { return Object.assign({}, o); }
    function row(k, v, cls) { return h("div.kv" + (cls ? "." + cls : ""), null, h("dt", null, k), h("dd", null, v)); }
    function drawTraverse() {
      if (!has("traverse")) return;
      S.steps = buildSteps(); if (S.step >= S.steps.length) S.step = S.steps.length - 1;
      var s = S.steps[S.step];
      var src = "for (int fila = 0; fila < " + name + ".length; fila++) {\n    for (int columna = 0; columna < " + name + "[fila].length; columna++) {\n        System.out.print(" + name + "[fila][columna] + \" \");\n    }\n    System.out.println();\n}";
      el.code.replaceChildren(L.ui.code(src, { numbered: true, active: s.line || undefined }));
      var v = s.vars || { fila: "—", columna: "—" };
      el.state.replaceChildren(row("fila", String(v.fila), "kv--row"), row("columna", String(v.columna), "kv--col"),
        row("¿Sigue el bucle?", s.cond ? (s.cond[0] ? "sí" : "no") + (s.cond[1] ? "  (" + s.cond[1] + ")" : "") : "—", s.cond && !s.cond[0] ? "is-bad" : ""));
      el.out.textContent = s.out || "(vacía)";
      el.tmsg.replaceChildren(rich(s.msg));
      el.prev.disabled = S.step === 0; el.next.disabled = S.step === S.steps.length - 1;
      el.counter.textContent = "Paso " + S.step + " de " + (S.steps.length - 1);
      draw();
    }
    if (has("traverse")) {
      el.code = h("div"); el.state = h("dl.kvs"); el.tmsg = h("p.sim__info", { "aria-live": "polite" }); el.counter = h("span.caption");
      el.out = h("pre.sim__out", { "aria-label": "Salida del programa" });
      el.prev = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "← Anterior");
      el.next = h("button.btn.btn--sm", { type: "button" }, "Siguiente →");
      el.restart = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Reiniciar");
      el.prev.addEventListener("click", function () { S.step = Math.max(0, S.step - 1); drawTraverse(); });
      el.next.addEventListener("click", function () { S.step = Math.min(S.steps.length - 1, S.step + 1); drawTraverse(); });
      el.restart.addEventListener("click", function () { S.step = 0; drawTraverse(); });
      root.appendChild(h("div.sim__panel", null, h("h4.sim__h", null, "Bucles anidados paso a paso"),
        h("div.sim__trace", null, el.code, h("div", null, el.state, h("p.caption", null, "Salida:"), el.out)), el.tmsg,
        h("div.sim__row", null, el.restart, el.prev, el.next, el.counter)));
    }

    function refresh() { drawTraverse(); if (!has("traverse")) draw(); drawInfo(); }
    refresh();
    return root;
  };
})(window.LoWKie = window.LoWKie || {});
