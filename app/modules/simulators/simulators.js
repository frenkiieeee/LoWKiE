/* Pantalla de simuladores: 1D y 2D con todas sus herramientas. */
(function (L) {
  var h = L.ui.h, ui = L.ui;

  L.router.register("/simuladores", "Simuladores", function (args) {
    var which = args[0] === "2d" ? "2d" : "1d";
    var tabs = h("div.segtabs", { role: "tablist", "aria-label": "Tipo de simulador" },
      tab("1d", "Array 1D", "#/simuladores/1d"), tab("2d", "Matriz 2D", "#/simuladores/2d"));
    function tab(id, label, href) {
      return h("a.segtab", { href: href, role: "tab", "aria-selected": String(which === id) }, label);
    }
    var body = which === "1d"
      ? L.sim.array1d({ values: [10, 20, 30, 40], name: "numeros" })
      : L.sim.matrix2d({ values: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], name: "matriz" });
    var intro = which === "1d"
      ? "Crea un array, cambia valores, prueba un índice que no existe y recórrelo paso a paso. Distingue siempre **índice**, **valor** y **longitud**."
      : "Selecciona celdas, comprueba cómo se leen sus dos índices y recorre la matriz con bucles anidados. Prueba también el ejemplo irregular.";
    return h("div", null,
      ui.pageHeader("Visualizar antes de memorizar", "Simuladores"),
      h("p.lead", null, ui.rich(intro)),
      tabs, body);
  });
})(window.LoWKie);
