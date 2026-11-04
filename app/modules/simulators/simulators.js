/* Pantalla de simuladores: 1D y 2D con todas sus herramientas. */
(function (L) {
  var h = L.ui.h, ui = L.ui;

  var SIMS = {
    "1d": ["Array 1D", "Crea un array, cambia valores, prueba un índice que no existe y recórrelo paso a paso. Distingue siempre **índice**, **valor** y **longitud**.", function () { return L.sim.array1d({ values: [10, 20, 30, 40], name: "numeros" }); }],
    "2d": ["Matriz 2D", "Selecciona celdas, comprueba cómo se leen sus dos índices y recorre la matriz con bucles anidados. Prueba también el ejemplo irregular.", function () { return L.sim.matrix2d({ values: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], name: "matriz" }); }],
    "orden": ["Ordenar", "Mira la burbuja trabajar: compara parejas vecinas y las intercambia. Pulsa «Mezclar» para probar con otro array.", function () { return L.sim.sortBubble({ values: [5, 3, 8, 1, 4], name: "a" }); }],
    "refs": ["Referencias", "`b = a` no copia el array. Compruébalo: elige cómo se crea `b` y cambia un valor.", function () { return L.sim.refs(); }]
  };

  L.router.register("/simuladores", "Simuladores", function (args) {
    var which = SIMS[args[0]] ? args[0] : "1d";
    var tabs = h("div.segtabs", { role: "tablist", "aria-label": "Tipo de simulador" }, Object.keys(SIMS).map(function (k) {
      return h("a.segtab", { href: "#/simuladores/" + k, role: "tab", "aria-selected": String(which === k) }, SIMS[k][0]);
    }));
    return h("div", null,
      ui.pageHeader("Visualizar antes de memorizar", "Simuladores"),
      h("p.lead", null, ui.rich(SIMS[which][1])),
      tabs, SIMS[which][2]());
  });
})(window.LoWKie);
