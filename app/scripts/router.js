/* Router por hash (#/ruta): funciona con file:// y sin servidor. */
(function (L) {
  var routes = {};   // path -> { title, render }
  var order = [];    // para la navegación

  L.router = {
    register: function (path, label, render, opts) {
      routes[path] = { label: label, render: render, wide: !!(opts && opts.wide) };
      order.push(path);
    },
    list: function () {
      return order.map(function (p) { return { path: p, label: routes[p].label }; });
    },
    // #/leccion/b2/3 → path "/leccion", args ["b2","3"]
    current: function () {
      var parts = (location.hash || "").replace(/^#/, "").split("/").filter(Boolean);
      var p = "/" + (parts[0] || "inicio");
      if (!routes[p]) return { path: "/inicio", args: [] };
      return { path: p, args: parts.slice(1) };
    },
    start: function () {
      window.addEventListener("hashchange", L.router.render);
      L.router.render();
    },
    render: function () {
      var cur = L.router.current(), path = cur.path;
      var view = document.getElementById("view");
      var node = routes[path].render(cur.args);
      view.replaceChildren(node);
      node.classList.add("view");
      node.classList.toggle("view--wide", routes[path].wide);
      document.title = routes[path].label + " · LoWKie";
      L.state.set("lastRoute", path);
      L.router.markNav(path);
      // Mueve el foco al título para lectores de pantalla y teclado.
      var t = document.getElementById("page-title");
      if (t) t.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    },
    markNav: function (path) {
      var links = document.querySelectorAll(".nav__item");
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("data-path") === path) links[i].setAttribute("aria-current", "page");
        else links[i].removeAttribute("aria-current");
      }
    }
  };
})(window.LoWKie = window.LoWKie || {});
