/* Componentes compartidos. Todo texto se inserta con textContent (nunca innerHTML). */
(function (L) {
  // h("div.clase", {atributos}, hijos...) → elemento DOM
  function h(tag, attrs) {
    var parts = tag.split(".");
    var el = document.createElement(parts[0] || "div");
    if (parts.length > 1) el.className = parts.slice(1).join(" ");
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === false || attrs[k] == null) return;
      el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) return child.forEach(function (c) { append(el, c); });
    el.appendChild(typeof child === "object" ? child : document.createTextNode(String(child)));
  }

  var C = {
    h: h,

    pageHeader: function (eyebrow, title, lead) {
      return h("header.page-header", null,
        h("p.eyebrow", null, eyebrow),
        h("h1.title", { id: "page-title", tabindex: "-1" }, title),
        lead && h("p.lead", null, lead));
    },

    button: function (label, href, ghost) {
      return h("a.btn" + (ghost ? ".btn--ghost" : ""), { href: href }, label, h("span", { "aria-hidden": "true" }, "→"));
    },

    progress: function (value, label) {
      return h("div.progress", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100,
        "aria-valuenow": value, "aria-label": label },
        h("div.progress__bar", { style: "width:" + value + "%" }));
    },

    badge: function (status) {
      var map = { done: ["Completado", "done"], current: ["En curso", "current"], todo: ["Pendiente", "todo"] };
      var m = map[status] || map.todo;
      return h("span.badge.badge--" + m[1], null, m[0]);
    },

    sectionHead: function (title, aside) {
      return h("div.section-head", null, h("h2.section-title", null, title), aside && h("span.caption", null, aside));
    },

    // Pantalla aún no construida: dice la verdad sobre su estado (spec §18.8).
    pending: function (phase, text, items) {
      return h("section.pending", null,
        h("p.pending__phase", null, phase),
        h("p", null, text),
        items && h("ul", null, items.map(function (i) { return h("li", null, i); })));
    }
  };

  L.ui = C;
})(window.LoWKie = window.LoWKie || {});

/* Diálogos accesibles (<dialog>) para pedir texto o confirmar. */
(function (L) {
  var h = L.ui.h;
  function open(build) {
    return new Promise(function (resolve) {
      var dlg = h("dialog.dlg");
      var finish = function (v) { dlg.close(); dlg.remove(); resolve(v); };
      build(dlg, finish);
      dlg.addEventListener("cancel", function (e) { e.preventDefault(); finish(null); });
      document.body.appendChild(dlg);
      dlg.showModal();
    });
  }
  L.ui.prompt = function (title, label, value) {
    return open(function (dlg, finish) {
      var input = h("input.dlg__input", { type: "text", id: "dlg-input", value: value || "", autocomplete: "off", spellcheck: "false" });
      var form = h("form", { method: "dialog" },
        h("h2.dlg__title", null, title),
        h("label", { for: "dlg-input" }, label), input,
        h("div.dlg__actions", null,
          h("button.btn.btn--ghost", { type: "button", id: "dlg-cancel" }, "Cancelar"),
          h("button.btn", { type: "submit" }, "Aceptar")));
      form.addEventListener("submit", function (e) { e.preventDefault(); finish(input.value.trim() || null); });
      form.querySelector("#dlg-cancel").addEventListener("click", function () { finish(null); });
      dlg.appendChild(form);
      setTimeout(function () { input.focus(); input.select(); }, 0);
    });
  };
  L.ui.confirm = function (title, text, okLabel) {
    return open(function (dlg, finish) {
      var okBtn = h("button.btn", { type: "button" }, okLabel || "Aceptar");
      var cancel = h("button.btn.btn--ghost", { type: "button" }, "Cancelar");
      okBtn.addEventListener("click", function () { finish(true); });
      cancel.addEventListener("click", function () { finish(false); });
      dlg.appendChild(h("div", null, h("h2.dlg__title", null, title), h("p", null, text),
        h("div.dlg__actions", null, cancel, okBtn)));
      setTimeout(function () { cancel.focus(); }, 0);
    }).then(function (v) { return v === true; });
  };
})(window.LoWKie);

/* Texto enriquecido y bloques de código. */
(function (L) {
  var h = L.ui.h;

  // `código` y **negrita** → nodos DOM (nunca innerHTML).
  L.ui.rich = function (text) {
    var frag = document.createDocumentFragment();
    String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return;
      if (part.charAt(0) === "`") frag.appendChild(h("code.inline", null, part.slice(1, -1)));
      else if (part.indexOf("**") === 0) frag.appendChild(h("strong", null, part.slice(2, -2)));
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  };

  var TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(public|class|static|void|for|if|else|new|return|while|final)\b|\b(int|double|boolean|String|char|long)\b|\b(\d+(?:\.\d+)?)\b/g;
  function highlightLine(line) {
    var out = [], last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(line))) {
      if (m.index > last) out.push(line.slice(last, m.index));
      var cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "t" : "n";
      out.push(h("span.tok-" + cls, null, m[0]));
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push(line.slice(last));
    return out;
  }
  // opts: { numbered, active (nº de línea 1-based), marks: {n: "clase"} }
  L.ui.code = function (src, opts) {
    opts = opts || {};
    var lines = String(src).replace(/\n$/, "").split("\n");
    var code = h("code");
    lines.forEach(function (ln, i) {
      var n = i + 1;
      var cls = "cl" + (opts.active === n ? " is-active" : "") + (opts.marks && opts.marks[n] ? " " + opts.marks[n] : "");
      var body;
      if (opts.slots && /\{\{\w+\}\}/.test(ln)) {   // huecos para ejercicios de completar
        body = [];
        ln.split(/\{\{(\w+)\}\}/).forEach(function (part, k) {
          if (k % 2) body.push(opts.slots[part]); else if (part) body = body.concat(highlightLine(part));
        });
      } else { body = highlightLine(ln); if (!body.length) body = "\u200b"; }
      code.appendChild(h("span." + cls.split(" ").join("."), { "data-line": n },
        opts.numbered ? h("span.cl__n", { "aria-hidden": "true" }, String(n)) : null,
        h("span.cl__t", null, body)));
    });
    return h("pre.code", { tabindex: "0", "aria-label": "Código Java" }, code);
  };
})(window.LoWKie);

/* Tarjeta de recomendación (bloque de color controlado). */
(function (L) {
  var h = L.ui.h;
  L.ui.recoCard = function (r) {
    return h("section.reco", { "aria-labelledby": "reco-t" },
      h("p.eyebrow", null, "Recomendación"),
      h("h2", { id: "reco-t", style: "font-size:var(--fs-sub)" }, r.activity),
      h("p", null, L.ui.rich(r.reason)),
      h("div.reco__meta", null, h("span", null, "Refuerza: " + r.concept), h("span", null, r.minutes + " min")),
      L.ui.button("Empezar", r.route));
  };
})(window.LoWKie);

/* Tarjeta «Falta Java»: instala un JDK portátil con un clic (con la confirmación del usuario). */
(function (L) {
  var h = L.ui.h;
  // java: estado de /api/health. onReady se llama cuando Java queda listo.
  L.ui.javaGate = function (java, onReady) {
    var old = java.state === "old";
    var msg = h("p", { "aria-live": "polite", role: "status" }, "");
    var bar = h("div.progress", { hidden: true, role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": 0, "aria-label": "Instalando Java" }, h("div.progress__bar", { style: "width:0%" }));
    var btn = h("button.btn", { type: "button" }, "Instalar Java automáticamente");
    var body = h("div.gate__body", null,
      h("h3.gate__t", null, old ? "Tu versión de Java es antigua" : "Falta Java para programar"),
      h("p", null, java.message),
      java.canInstall === false
        ? h("p", null, "Instala un JDK 21 o superior desde ", h("a", { href: "https://adoptium.net/", target: "_blank", rel: "noopener" }, "adoptium.net"), " y reinicia LoWKie.")
        : h("p", null, "LoWKie puede instalarlo por ti con un clic: descarga Temurin JDK 21 (unos 190 MB) de adoptium.net, comprueba que no esté alterado y lo guarda en tu perfil de LoWKie. No necesita contraseña de administrador ni cambia nada más de tu equipo."),
      java.canInstall === false ? null : h("div.sim__row", null, btn), bar, msg);
    var box = h("section.gate", { "aria-label": "Instalar Java" }, body);

    function fail(text) { msg.textContent = text; msg.className = "gate__err"; btn.disabled = false; btn.textContent = "Reintentar"; bar.hidden = true; }
    function poll() {
      L.api.installStatus().then(function (r) {
        var s = r.install;
        if (s.status === "running") {
          bar.hidden = false; bar.setAttribute("aria-valuenow", s.percent); bar.firstChild.style.width = s.percent + "%";
          msg.className = ""; msg.textContent = s.phase + (s.percent ? " · " + s.percent + " %" : "") + " (puede tardar unos minutos)";
          return setTimeout(poll, 600);
        }
        if (s.status === "error") return fail(s.error || "No se pudo instalar Java.");
        // done
        return L.api.health().then(function (hd) {
          if (hd.java.state === "ready") { box.remove(); if (onReady) onReady(hd.java); }
          else fail("Java se instaló pero no se detecta: " + hd.java.message);
        });
      }).catch(function (e) { fail(e.message); });
    }
    btn.addEventListener("click", function () {
      btn.disabled = true; btn.textContent = "Instalando…"; msg.className = ""; msg.textContent = "Preparando la descarga…"; bar.hidden = false;
      L.api.installJava().then(function () { poll(); }).catch(function (e) { fail(e.message); });
    });
    return box;
  };
})(window.LoWKie);

/* «Cómo iniciar LoWKie» según el sistema del alumno (se muestra cuando no hay servicio conectado). */
(function (L) {
  var h = L.ui.h;
  function detectOS() {
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "") + " " + (navigator.userAgent || "");
    if (/win/i.test(p)) return "win";
    if (/mac|iphone|ipad/i.test(p)) return "mac";
    return "linux";
  }
  L.ui.detectOS = detectOS;
  // A partir de la ruta de index.html (location.pathname) deduce la carpeta de LoWKie y el comando exacto para iniciarla.
  L.ui.launchInfo = function (pathname, os) {
    var dir = decodeURIComponent(pathname).replace(/[^/]*$/, "").replace(/\/$/, "");
    if (os === "win") return { dir: dir.replace(/^\/([A-Za-z]:)/, "$1").replace(/\//g, "\\"), cmd: null };
    return { dir: dir, cmd: "sh '" + (dir + "/start-lowkie.sh").replace(/'/g, "'\\''") + "'" };
  };
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {   // plan B para navegadores que no permiten el portapapeles en file://
      var t = h("textarea", { style: "position:fixed;opacity:0" }, text); document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? ok() : no(); } catch (e) { no(e); } t.remove();
    });
  }
  function cmdBox(cmd) {
    var status = h("span.caption", { role: "status", "aria-live": "polite" }, "");
    var btn = h("button.btn.btn--sm", { type: "button" }, "Copiar comando");
    btn.addEventListener("click", function () {
      copy(cmd).then(function () { status.textContent = "Copiado. Ahora pégalo en la terminal y pulsa Intro."; }, function () { status.textContent = "No se pudo copiar: selecciónalo a mano."; });
    });
    return h("div", null, h("pre.code.code--cmd", { tabindex: "0" }, cmd), h("div.sim__row", null, btn, status));
  }
  L.ui.startCard = function (title) {
    var os = detectOS(), info = L.ui.launchInfo(location.pathname, os), kids;
    if (os === "win") kids = [
      h("p", null, L.ui.rich("Haz **doble clic** en `Start-LoWKie.bat`, dentro de la carpeta de LoWKie:")),
      h("p.caption", null, info.dir),
      h("p.caption", null, "Si Windows avisa con «SmartScreen»: Más información → Ejecutar de todas formas.")];
    else if (os === "mac") kids = [
      h("p", null, L.ui.rich("Haz **doble clic** en `Start-LoWKie.terminal` (en la carpeta de LoWKie).")),
      h("p.caption", null, "Si macOS lo bloquea: clic derecho sobre el archivo → Abrir. También sirve este comando: copia, abre Terminal, pega y pulsa Intro."),
      cmdBox(info.cmd)];
    else kids = [h("p", null, "Abre una terminal, pega este comando y pulsa Intro:"), cmdBox(info.cmd)];
    return h("section.gate", { "aria-label": "Cómo iniciar LoWKie" }, h("div.gate__body", null,
      h("h3.gate__t", null, title || "Para programar, inicia LoWKie"),
      h("p", null, "Ahora estás en modo lectura: teoría, simuladores y ejercicios de test funcionan, pero para editar y ejecutar Java hay que iniciar LoWKie. Es un solo paso:"),
      kids,
      h("p.caption", null, "Se abrirá el navegador solo. La primera vez te preguntará antes de descargar lo que le falte (Node.js y Java).")));
  };
})(window.LoWKie);
