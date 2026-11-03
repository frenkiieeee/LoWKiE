/* Code Space: explorador + pestañas + editor CodeMirror + compilar/ejecutar con el JDK real. */
(function (L) {
  var h = L.ui.h, ui = L.ui, api = L.api;
  var root = null;   // el nodo se conserva al cambiar de pantalla para no perder pestañas ni historial

  function render() {
    if (!api.available) return offline();
    if (!root) root = build();
    root._refresh();
    root._openWanted();
    return root;
  }

  // Abierto como archivo (file://): sin servicio local no hay Java ni archivos.
  function offline() {
    return h("div", null,
      ui.pageHeader("Entorno real", "Code Space", "Un editor Java con explorador de archivos, compilación y ejecución con un JDK real."),
      ui.startCard("Para usar Code Space, inicia LoWKie"));
  }

  function build() {
    var S = {
      tabs: {},            // path -> { path, name, editor, wrap, saved, mtime, dirty }
      order: [], active: null,
      expanded: { "": true }, children: {}, selected: null,   // selected: { path, type }
      runId: null, polling: null, java: null, busy: false, autosave: false, autosaveTimer: null
    };
    var el = {};

    // ---------- Estructura ----------
    el.workspace = h("span.cs__ws", null, "…");
    el.java = h("span.badge.badge--todo", { role: "status" }, "Java: comprobando…");
    el.btnRun = h("button.btn", { type: "button" }, "Ejecutar");
    el.btnStop = h("button.btn.btn--ghost", { type: "button", disabled: true }, "Detener");
    el.btnCompile = h("button.btn.btn--ghost", { type: "button", title: "Compila el archivo activo y las clases que usa" }, "Compilar");
    el.autosave = h("input", { type: "checkbox", id: "cs-autosave" });
    el.toast = h("span.cs__toast", { role: "status", "aria-live": "polite" });
    el.btnAssist = h("button.btn.btn--ghost.btn--sm", { type: "button", "aria-expanded": "true" }, "Asistente");

    el.tree = h("ul.tree", { role: "tree", "aria-label": "Archivos del proyecto" });
    el.tabs = h("div.tabs", { role: "tablist", "aria-label": "Archivos abiertos" });
    el.editors = h("div.cs__editors");
    el.empty = h("div.cs__empty", null, h("p", null, "Abre un archivo del explorador para empezar."));
    el.out = h("pre.out", { tabindex: "0", "aria-label": "Salida del programa" });
    el.problems = h("div.problems");
    el.panelTabs = {
      out: h("button.ptab", { type: "button", role: "tab", "aria-selected": "true" }, "Salida"),
      problems: h("button.ptab", { type: "button", role: "tab", "aria-selected": "false" }, "Problemas")
    };

    var tb = function (label, fn) { var b = h("button.btn.btn--ghost.btn--sm", { type: "button" }, label); b.addEventListener("click", fn); return b; };
    el.selBtns = [tb("Renombrar", doRename), tb("Eliminar", doDelete)];
    el.selBtns.forEach(function (b) { b.disabled = true; });

    var explorer = h("aside.cs__explorer", { "aria-label": "Explorador" },
      h("div.cs__title", null, "Explorador"),
      h("div.cs__tools", null, tb("Archivo", newFile), tb("Carpeta", newFolder), el.selBtns, tb("Actualizar", function () { refreshTree(); }), tb("Abrir carpeta…", openFolder)),
      el.tree);

    var main = h("section.cs__main", { "aria-label": "Editor" }, el.tabs, el.empty, el.editors);

    el.goal = h("p", null, "…");
    el.goalLink = h("a.caption", { href: "#/leccion" }, "Ir a la lección");
    var assistant = h("aside.cs__assist", { "aria-label": "Asistente de aprendizaje" },
      h("div.cs__title", null, "Asistente"),
      h("p.eyebrow", null, "Objetivo actual"), el.goal, el.goalLink,
      h("p.eyebrow", { style: "margin-top:var(--space-4)" }, "Prueba esto"),
      h("p", null, "Cambia un valor del array en Main.java, pulsa Ejecutar y comprueba la salida."),
      h("p.caption", { style: "margin-top:var(--space-4)" }, "Las pistas están en cada ejercicio de la lección; los de programación se comprueban aquí."));

    var panel = h("section.cs__panel", { "aria-label": "Salida y problemas" },
      h("div.ptabs", { role: "tablist" }, el.panelTabs.out, el.panelTabs.problems),
      el.out, el.problems);
    el.problems.hidden = true;

    el.gate = h("div");
    var top = h("div.cs__top", null,
      h("div.cs__topl", null, h("h1.cs__h1", { id: "page-title", tabindex: "-1" }, "Code Space"), h("span.caption", null, "Proyecto:"), el.workspace, el.java),
      h("div.cs__topr", null, el.toast,
        h("label.cs__check", { for: "cs-autosave" }, el.autosave, " Autoguardado"),
        el.btnAssist, el.btnCompile, el.btnStop, el.btnRun), el.gate);

    var wrap = h("div.cs", null, top, h("div.cs__body", null, explorer, main, assistant), panel);

    // ---------- Eventos ----------
    el.btnRun.addEventListener("click", function () { runActive(true); });
    el.btnCompile.addEventListener("click", function () { runActive(false); });
    el.btnStop.addEventListener("click", stopRun);
    el.autosave.addEventListener("change", function () {
      S.autosave = el.autosave.checked;
      api.putSettings({ autosave: S.autosave }).catch(function () {});
    });
    el.btnAssist.addEventListener("click", function () {
      var hide = !assistant.hidden; assistant.hidden = hide;
      wrap.classList.toggle("cs--noassist", hide);
      el.btnAssist.setAttribute("aria-expanded", String(!hide));
    });
    Object.keys(el.panelTabs).forEach(function (k) {
      el.panelTabs[k].addEventListener("click", function () { showPanel(k); });
    });
    window.addEventListener("beforeunload", function (e) {
      if (dirtyTabs().length) { e.preventDefault(); e.returnValue = ""; }
    });

    // ---------- Utilidades ----------
    function say(text, isError) {
      el.toast.textContent = text; el.toast.classList.toggle("is-error", !!isError);
      clearTimeout(say.t); say.t = setTimeout(function () { el.toast.textContent = ""; }, 4000);
    }
    function fail(e) { say(e && e.message ? e.message : "Ha ocurrido un error.", true); }
    function dirtyTabs() { return S.order.filter(function (p) { return S.tabs[p].dirty; }); }
    function showPanel(k) {
      el.out.hidden = k !== "out"; el.problems.hidden = k !== "problems";
      Object.keys(el.panelTabs).forEach(function (n) { el.panelTabs[n].setAttribute("aria-selected", String(n === k)); });
    }
    function append(text, cls) {
      var s = h("span" + (cls ? "." + cls : ""), null, text);
      el.out.appendChild(s); el.out.scrollTop = el.out.scrollHeight;
    }
    function setBusy(b) {
      S.busy = b;
      el.btnRun.disabled = b || !javaReady(); el.btnCompile.disabled = b || !javaReady();
    }
    function javaReady() { return S.java && S.java.state === "ready"; }
    function parentOf(p) { var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
    function join(dir, name) { return dir ? dir + "/" + name : name; }

    // ---------- Java / salud ----------
    function refreshGoal() {
      var nx = L.progress.nextStep();
      el.goal.textContent = nx ? nx.block.title + ": " + nx.block.goal + "." : "Has completado la unidad. Practica libremente.";
      el.goalLink.href = nx ? L.progress.routeToStep(nx) : "#/aprendizaje";
    }
    function refreshHealth() {
      refreshGoal();
      api.health().then(function (d) {
        S.java = d.java;
        el.java.textContent = "Java: " + (d.java.state === "ready" ? "listo (JDK " + d.java.major + ")" : d.java.message);
        el.java.className = "badge " + (d.java.state === "ready" ? "badge--done" : "badge--todo");
        el.gate.replaceChildren();
        if (d.java.state !== "ready") el.gate.appendChild(L.ui.javaGate(d.java, function () { refreshHealth(); }));
        if (!S.busy) setBusy(false);
      }).catch(fail);
      api.workspace().then(function (d) { el.workspace.textContent = d.workspace ? d.workspace.name : "—"; el.workspace.title = d.workspace ? d.workspace.root : ""; }).catch(fail);
      api.getSettings().then(function (d) { S.autosave = !!d.settings.autosave; el.autosave.checked = S.autosave; assistant.hidden = d.settings.assistantVisible === false; }).catch(function () {});
    }

    // ---------- Explorador ----------
    function refreshTree() {
      var dirs = Object.keys(S.expanded).filter(function (k) { return S.expanded[k]; });
      return Promise.all(dirs.map(function (d) {
        return api.list(d).then(function (r) { S.children[d] = r.entries; }, function () { delete S.expanded[d]; });
      })).then(drawTree).catch(fail);
    }
    function drawTree() {
      el.tree.replaceChildren();
      (function walk(dir, depth, ul) {
        (S.children[dir] || []).forEach(function (e) {
          var isDir = e.type === "dir", open = isDir && S.expanded[e.path];
          var sel = S.selected && S.selected.path === e.path;
          var btn = h("button.tree__row" + (sel ? ".is-selected" : ""), { type: "button", style: "padding-left:" + (0.5 + depth * 1) + "rem" },
            h("span.tree__ico", { "aria-hidden": "true" }, isDir ? (open ? "▾" : "▸") : "·"), e.name);
          btn.addEventListener("click", function () {
            S.selected = { path: e.path, type: e.type };
            if (isDir) toggleDir(e.path); else { openFile(e.path); drawTree(); }
            el.selBtns.forEach(function (b) { b.disabled = false; });
          });
          var li = h("li", { role: "treeitem", "aria-expanded": isDir ? String(!!open) : false, "aria-selected": String(!!sel) }, btn);
          ul.appendChild(li);
          if (open) { var sub = h("ul", { role: "group" }); li.appendChild(sub); walk(e.path, depth + 1, sub); }
        });
      })("", 0, el.tree);
      if (!(S.children[""] || []).length) el.tree.appendChild(h("li.caption", { style: "padding:var(--space-3)" }, "La carpeta está vacía."));
    }
    function toggleDir(p) {
      if (S.expanded[p]) { S.expanded[p] = false; return drawTree(); }
      S.expanded[p] = true;
      api.list(p).then(function (r) { S.children[p] = r.entries; drawTree(); }).catch(function (e) { S.expanded[p] = false; fail(e); });
    }
    function targetDir() {
      if (!S.selected) return "";
      return S.selected.type === "dir" ? S.selected.path : parentOf(S.selected.path);
    }
    function validName(n) { return n && !/[\\/:*?"<>|]/.test(n) && n !== "." && n !== ".."; }

    function newFile() {
      ui.prompt("Nuevo archivo", "Nombre (por ejemplo Prueba.java)").then(function (name) {
        if (!name) return;
        if (!validName(name)) return say("El nombre no puede contener / \\ : * ? \" < > |", true);
        var p = join(targetDir(), name);
        var cls = name.replace(/\.java$/, "");
        var tpl = /\.java$/.test(name) && /^[A-Za-z_$][\w$]*$/.test(cls)
          ? "public class " + cls + " {\n    public static void main(String[] args) {\n        \n    }\n}\n" : "";
        api.write(p, tpl, { createOnly: true }).then(function () {
          S.expanded[targetDir()] = true; return refreshTree();
        }).then(function () { openFile(p); say("Archivo creado."); }).catch(fail);
      });
    }
    function newFolder() {
      ui.prompt("Nueva carpeta", "Nombre de la carpeta").then(function (name) {
        if (!name) return;
        if (!validName(name)) return say("El nombre no puede contener / \\ : * ? \" < > |", true);
        api.mkdir(join(targetDir(), name)).then(function () { S.expanded[targetDir()] = true; return refreshTree(); })
          .then(function () { say("Carpeta creada."); }).catch(fail);
      });
    }
    function doRename() {
      var sel = S.selected; if (!sel) return;
      var old = sel.path.split("/").pop();
      ui.prompt("Renombrar", "Nuevo nombre", old).then(function (name) {
        if (!name || name === old) return;
        if (!validName(name)) return say("El nombre no puede contener / \\ : * ? \" < > |", true);
        var np = join(parentOf(sel.path), name);
        var affected = S.order.filter(function (p) { return p === sel.path || p.indexOf(sel.path + "/") === 0; });
        if (affected.some(function (p) { return S.tabs[p].dirty; })) return say("Guarda los cambios del archivo antes de renombrarlo.", true);
        api.rename(sel.path, np).then(function () {
          affected.forEach(function (p) { closeTab(p, true); });
          S.selected = { path: np, type: sel.type };
          return refreshTree();
        }).then(function () { say("Renombrado."); }).catch(fail);
      });
    }
    function doDelete() {
      var sel = S.selected; if (!sel) return;
      ui.confirm("Eliminar", "¿Eliminar «" + sel.path + "»" + (sel.type === "dir" ? " y todo su contenido" : "") + "? Esta acción no se puede deshacer.", "Eliminar").then(function (yes) {
        if (!yes) return;
        api.remove(sel.path).then(function () {
          S.order.filter(function (p) { return p === sel.path || p.indexOf(sel.path + "/") === 0; }).forEach(function (p) { closeTab(p, true); });
          S.selected = null; el.selBtns.forEach(function (b) { b.disabled = true; });
          return refreshTree();
        }).then(function () { say("Eliminado."); }).catch(fail);
      });
    }
    function openFolder() {
      var go = function () {
        api.openWorkspace().then(function (r) {
          if (r.cancelled) return;
          S.order.slice().forEach(function (p) { closeTab(p, true); });
          S.expanded = { "": true }; S.children = {}; S.selected = null;
          el.workspace.textContent = r.name;
          return refreshTree();
        }).catch(fail);
      };
      if (dirtyTabs().length) ui.confirm("Cambios sin guardar", "Si cambias de proyecto se perderán los cambios sin guardar.", "Cambiar de proyecto").then(function (y) { if (y) go(); });
      else go();
    }

    // ---------- Pestañas y editor ----------
    function openFile(p) {
      if (S.tabs[p]) return activate(p);
      api.read(p).then(function (r) {
        var wrapEd = h("div.cs__ed", { hidden: true });
        el.editors.appendChild(wrapEd);
        var tab = { path: p, name: p.split("/").pop(), wrap: wrapEd, saved: r.content, mtime: r.mtime, dirty: false };
        tab.editor = L.CM.create(wrapEd, {
          doc: r.content,
          onChange: function () { markDirty(tab); },
          onSave: function () { saveTab(tab); }
        });
        S.tabs[p] = tab; S.order.push(p); activate(p);
      }).catch(fail);
    }
    function markDirty(tab) {
      var dirty = tab.editor.getValue() !== tab.saved;
      if (dirty !== tab.dirty) { tab.dirty = dirty; drawTabs(); }
      if (dirty && S.autosave) {
        clearTimeout(S.autosaveTimer);
        S.autosaveTimer = setTimeout(function () { if (tab.dirty && S.tabs[tab.path]) saveTab(tab, true); }, 1500);
      }
    }
    function activate(p) {
      S.active = p;
      S.order.forEach(function (k) { S.tabs[k].wrap.hidden = k !== p; });
      el.empty.hidden = true; drawTabs();
      S.tabs[p].editor.focus();
    }
    function drawTabs() {
      el.tabs.replaceChildren();
      S.order.forEach(function (p) {
        var t = S.tabs[p], on = p === S.active;
        var b = h("button.tab" + (on ? ".is-active" : ""), { type: "button", role: "tab", "aria-selected": String(on), title: p },
          t.name, t.dirty ? h("span.tab__dot", { "aria-label": "con cambios sin guardar" }, "●") : null);
        b.addEventListener("click", function () { activate(p); });
        var x = h("button.tab__x", { type: "button", "aria-label": "Cerrar " + t.name }, "×");
        x.addEventListener("click", function () { closeTab(p); });
        el.tabs.appendChild(h("div.tabwrap" + (on ? ".is-active" : ""), null, b, x));
      });
      el.empty.hidden = S.order.length > 0;
    }
    function closeTab(p, force) {
      var t = S.tabs[p]; if (!t) return;
      var doClose = function () {
        t.editor.destroy(); t.wrap.remove(); delete S.tabs[p];
        S.order.splice(S.order.indexOf(p), 1);
        if (S.active === p) { S.active = null; if (S.order.length) activate(S.order[S.order.length - 1]); }
        drawTabs();
      };
      if (t.dirty && !force) ui.confirm("Cambios sin guardar", "«" + t.name + "» tiene cambios sin guardar. ¿Cerrar y descartarlos?", "Descartar y cerrar").then(function (y) { if (y) doClose(); });
      else doClose();
    }
    function saveTab(tab, quiet, force) {
      var text = tab.editor.getValue();
      return api.write(tab.path, text, { expectedMtime: tab.mtime, force: !!force }).then(function (r) {
        tab.saved = text; tab.mtime = r.mtime; tab.dirty = tab.editor.getValue() !== text; drawTabs();
        if (!quiet) say("Guardado ✓");
      }, function (e) {
        if (e.code === "FILE_CHANGED_EXTERNALLY") {
          return ui.confirm("El archivo cambió fuera de LoWKie", "«" + tab.name + "» se modificó desde otra aplicación. ¿Sobrescribirlo con lo que ves aquí?", "Sobrescribir")
            .then(function (y) { return y ? saveTab(tab, quiet, true) : undefined; });
        }
        fail(e);
        throw e;
      });
    }
    function saveAll() { return Promise.all(dirtyTabs().map(function (p) { return saveTab(S.tabs[p], true); })); }

    // ---------- Compilar y ejecutar ----------
    function clearOut() { el.out.replaceChildren(); }
    function drawProblems(diags) {
      el.problems.replaceChildren();
      if (!diags.length) { el.problems.appendChild(h("p.caption", null, "Sin problemas.")); return; }
      diags.forEach(function (d) {
        var open = h("button.problem__loc", { type: "button" }, d.file + ":" + d.line);
        open.addEventListener("click", function () { openFile(d.file); });
        el.problems.appendChild(h("div.problem" + (d.severity === "error" ? ".is-error" : ""), null,
          open, h("p.problem__msg", null, d.message),
          d.hint ? h("p.problem__hint", null, "Pista: " + d.hint) : null));
      });
    }
    function runActive(execute) {
      if (S.busy) return;
      var file = S.active;
      if (execute && (!file || !/\.java$/.test(file))) return say("Abre el archivo .java que quieres ejecutar.", true);
      setBusy(true); clearOut(); showPanel("out");
      saveAll().then(function () {
        append("Compilando…\n", "out__sys");
        return api.compile(/\.java$/.test(file || "") ? file : undefined);   // solo el archivo activo y lo que use
      }).then(function (c) {
        drawProblems(c.diagnostics);
        if (!c.success) {
          append(c.stderr || "La compilación ha fallado.\n", "out__err");
          append("\nCompilación fallida (" + c.diagnostics.length + " problema(s)). Mira la pestaña «Problemas» para ver explicaciones.\n", "out__sys");
          el.panelTabs.problems.textContent = "Problemas (" + c.diagnostics.length + ")";
          showPanel("problems"); setBusy(false); return;
        }
        el.panelTabs.problems.textContent = "Problemas";
        append("Compilado en " + c.durationMs + " ms.\n", "out__sys");
        if (!execute) return setBusy(false);
        return api.run(file).then(function (r) {
          S.runId = r.runId; el.btnStop.disabled = false;
          append("Ejecutando " + r.mainClass + "…\n\n", "out__sys");
          poll(0);
        });
      }).catch(function (e) { fail(e); append((e.message || "Error") + "\n", "out__err"); setBusy(false); });
    }
    function poll(after) {
      api.status(S.runId, after).then(function (s) {
        s.chunks.forEach(function (c) { append(c.text, c.stream === "stderr" ? "out__err" : c.stream === "system" ? "out__sys" : ""); });
        if (s.status === "running") { S.polling = setTimeout(function () { poll(s.next); }, 150); return; }
        var label = { finished: "terminó correctamente", failed: "terminó con error", stopped: "se detuvo", timeout: "se detuvo por tiempo", error: "no pudo iniciarse" }[s.status] || s.status;
        append("\n— El programa " + label + (s.exitCode != null ? " (código " + s.exitCode + ")" : "") + " en " + s.durationMs + " ms.\n", "out__sys");
        S.runId = null; el.btnStop.disabled = true; setBusy(false);
      }).catch(function (e) { fail(e); S.runId = null; el.btnStop.disabled = true; setBusy(false); });
    }
    function stopRun() {
      if (!S.runId) return;
      api.stop(S.runId).catch(fail);
    }

    // ---------- Arranque ----------
    // Un ejercicio puede pedir abrir un archivo concreto (clave "openFile" del estado).
    function openWanted() {
      var want = L.state.get("openFile", null);
      if (!want) return false;
      L.state.set("openFile", null);
      var dir = parentOf(want);
      if (dir) { S.expanded[dir] = true; refreshTree(); }
      openFile(want);
      return true;
    }
    api.workspace().then(function (d) { return d.workspace ? refreshTree().then(function () { return openWanted() || openFirst(); }) : null; }).catch(fail);
    setTimeout(function () { S.booted = true; }, 0);
    function openFirst() {
      var src = (S.children[""] || []).filter(function (e) { return e.name === "src"; })[0];
      if (!src) return;
      S.expanded.src = true;
      return api.list("src").then(function (r) {
        S.children.src = r.entries; drawTree();
        var main = r.entries.filter(function (e) { return e.name === "Main.java"; })[0];
        if (main) openFile(main.path);
      });
    }
    wrap._refresh = refreshHealth;
    wrap._openWanted = function () { if (S.booted) openWanted(); };
    return wrap;
  }

  L.router.register("/code-space", "Code Space", render, { wide: true });
})(window.LoWKie);
