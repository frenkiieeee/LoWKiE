/* Simulador de referencias y copias de arrays. L.sim.refs() → elemento DOM. */
(function (L) {
  var h = L.ui.h, rich = L.ui.rich;
  var COLORS = ["var(--color-blue)", "var(--color-green-dark)", "#9A3412", "#6D28D9"];

  L.sim.refs = function () {
    var S;
    function fresh() { return { arrays: { 1: [1, 2, 3] }, vars: { a: 1 }, next: 2, msg: "Hay un array en memoria (`@1`) y una variable `a` que apunta a él. Prueba las acciones." }; }
    S = fresh();
    var el = { mem: h("div.refs__mem"), info: h("p.sim__info", { "aria-live": "polite" }) };
    var btns = {};
    function act(label, fn) { var b = h("button.btn.btn--ghost.btn--sm.btn--code", { type: "button" }, label); b.addEventListener("click", function () { fn(); draw(); }); btns[label] = b; return b; }

    var bAlias = act("int[] b = a;", function () { S.vars.b = S.vars.a; S.msg = "`b = a` **no crea un array**: ahora `a` y `b` apuntan al mismo array `@" + S.vars.a + "`."; });
    var bClone = act("int[] b = a.clone();", function () { var id = S.next++; S.arrays[id] = S.arrays[S.vars.a].slice(); S.vars.b = id; S.msg = "`clone()` **crea un array nuevo** (`@" + id + "`) con los mismos valores. `b` apunta a la copia."; });
    var bB = act("b[0] = 99;", function () {
      if (S.vars.b == null) { S.msg = "Primero crea `b` con una de las dos primeras acciones."; return; }
      S.arrays[S.vars.b][0] = 99;
      S.msg = S.vars.a === S.vars.b ? "Se cambió `b[0]`, pero `a` y `b` son **el mismo array**: `a[0]` también vale 99." : "Se cambió solo la copia: `a[0]` sigue valiendo " + S.arrays[S.vars.a][0] + ".";
    });
    var bA = act("a[0] = 7;", function () {
      S.arrays[S.vars.a][0] = 7;
      S.msg = (S.vars.b != null && S.vars.a === S.vars.b) ? "Cambia `a[0]` y, como `b` es el mismo array, `b[0]` también vale 7." : "Se cambió `a[0]`." + (S.vars.b != null ? " La copia `b` no se ve afectada." : "");
    });
    var bReset = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Reiniciar");
    bReset.addEventListener("click", function () { S = fresh(); draw(); });

    function color(id) { return COLORS[(id - 1) % COLORS.length]; }
    function draw() {
      el.mem.replaceChildren();
      var ids = Object.keys(S.arrays);
      ids.forEach(function (id) {
        var owners = Object.keys(S.vars).filter(function (v) { return String(S.vars[v]) === id; });
        el.mem.appendChild(h("div.refs__arr", { style: "border-color:" + color(+id) },
          h("div.refs__tag", { style: "background:" + color(+id) }, "array @" + id),
          h("div.refs__cells", null, S.arrays[id].map(function (v, i) { return h("span.refs__cell", null, h("small", null, String(i)), String(v)); })),
          h("div.refs__vars", null, owners.length ? ["Variables: ", owners.map(function (o) { return h("code.inline", null, o); })] : "Ninguna variable apunta aquí")));
      });
      el.info.replaceChildren(rich(S.msg));
      bAlias.disabled = bClone.disabled = S.vars.b != null;
    }
    var root = h("div.sim", null,
      h("div.sim__panel", null, h("h4.sim__h", null, "Memoria"), el.mem, el.info),
      h("div.sim__panel", null, h("h4.sim__h", null, "Acciones"),
        h("div.sim__row", null, bAlias, bClone, bB, bA, bReset),
        h("p.caption", null, "Elige primero cómo se crea `b` y después modifica un valor. Pulsa «Reiniciar» para probar la otra forma.")));
    draw();
    return root;
  };

  // Construye el simulador que pide un paso de lección ({type: "1d" | "2d" | "sort" | "refs", ...}).
  L.sim.build = function (cfg) {
    if (cfg.type === "2d") return L.sim.matrix2d(cfg);
    if (cfg.type === "sort") return L.sim.sortBubble(cfg);
    if (cfg.type === "refs") return L.sim.refs(cfg);
    return L.sim.array1d(cfg);
  };
})(window.LoWKie = window.LoWKie || {});
