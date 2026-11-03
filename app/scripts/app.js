/* Arranque: navegación, modo facilitador, sincronización del progreso y router. */
(function (L) {
  var h = L.ui.h;
  var nav = document.getElementById("nav");
  L.router.list().forEach(function (r, i) {
    nav.appendChild(h("a.nav__item", { href: "#" + r.path, "data-path": r.path },
      h("span.nav__num", { "aria-hidden": "true" }, "0" + (i + 1)), r.label));
  });

  // Modo facilitador: muestra notas docentes y habilita soluciones (spec §3.2).
  var fac = document.getElementById("fac");
  fac.checked = !!L.state.get("facilitator", false);
  fac.addEventListener("change", function () { L.state.set("facilitator", fac.checked); L.router.render(); });

  // Primera visita sin hash: ir a la última pantalla visitada.
  if (!location.hash) location.hash = "#" + L.state.get("lastRoute", "/inicio");

  // Con servicio local se recupera antes el progreso guardado en el perfil del usuario.
  L.progress.sync().then(function () { L.router.start(); });
})(window.LoWKie);
