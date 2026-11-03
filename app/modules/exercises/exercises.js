/* Motor de ejercicios. L.exercises.render(ex) → elemento DOM.
   Tipos: prediction · interpretation · detection · completar · ordenar · programacion.
   - La solución no se muestra hasta haber intentado el ejercicio (o gastado todas las pistas).
   - Cada comprobación registra intento/acierto en L.progress y explica el razonamiento. */
(function (L) {
  var h = L.ui.h, rich = L.ui.rich, P = L.progress, C = L.content;
  var norm = function (s) { return String(s).replace(/\s+/g, " ").trim(); };
  var TYPE = { prediction: "Predicción", interpretation: "Interpretación", detection: "Detección de errores",
    completar: "Completar", ordenar: "Ordenar", programacion: "Programación" };
  var DIFF = { beginner: "Básico", intermediate: "Intermedio", challenge: "Reto" };
  var uidN = 0;

  // Barajado determinista (el mismo ejercicio se muestra igual cada vez) que nunca deja el orden resuelto.
  function shuffled(n, seedStr, solved) {
    var seed = 0; for (var i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var idx, tries = 0;
    do {
      idx = []; for (var k = 0; k < n; k++) idx.push(k);
      for (var j = n - 1; j > 0; j--) { var r = Math.floor(rnd() * (j + 1)); var t = idx[j]; idx[j] = idx[r]; idx[r] = t; }
      tries++;
    } while (solved(idx) && tries < 20);
    return idx;
  }

  function render(ex, opts) {
    opts = opts || {};
    var id = ex.id, uid = "ex" + (++uidN);
    var S = { hints: 0, locked: false, revealed: false, attempts: 0 };
    var fb = h("div.fb", { role: "status", "aria-live": "polite" });
    var hintList = h("ol.hints");
    var area = h("div.ex__area");
    var btnCheck = h("button.btn", { type: "button" }, "Comprobar");
    var btnHint = h("button.btn.btn--ghost", { type: "button" }, "");
    var btnSol = h("button.btn.btn--ghost", { type: "button", hidden: true }, "Ver solución");
    var done = P.isExerciseDone(id);
    var badge = h("span.badge", null, "");

    function setBadge() {
      var d = P.isExerciseDone(id), rev = P.get().revealed.indexOf(id) >= 0 && P.get().completed.indexOf(id) < 0;
      badge.className = "badge " + (d ? (rev ? "badge--todo" : "badge--done") : "badge--todo");
      badge.textContent = d ? (rev ? "Resuelto con ayuda" : "Completado") : "Pendiente";
    }
    function say(kind, nodes) {
      fb.className = "fb fb--" + kind;
      fb.replaceChildren.apply(fb, [].concat(nodes).filter(Boolean));   // replaceChildren(null) escribiría «null»
    }
    function updateHintBtn() {
      var n = (ex.hints || []).length;
      btnHint.textContent = S.hints >= n ? "Sin más pistas" : "Pista (" + (S.hints + 1) + " de " + n + ")";
      btnHint.disabled = S.hints >= n || S.locked;
    }
    function maybeOfferSolution() {
      var canShow = S.attempts > 0 || S.hints >= (ex.hints || []).length || L.state.get("facilitator", false);
      btnSol.hidden = !canShow || S.revealed;
    }
    function lock() { S.locked = true; btnCheck.disabled = true; updateHintBtn(); area.classList.add("is-locked"); if (impl) impl.disable(); }

    function result(ok, detail) {
      S.attempts++; P.attempt(id, ok); setBadge(); if (opts.onChange) opts.onChange();
      if (ok) {
        say("ok", [h("p.fb__t", null, "¡Correcto!"), h("p", null, rich(ex.explanation))]);
        lock(); btnSol.hidden = true;
      } else {
        say("bad", [h("p.fb__t", null, "Todavía no."), detail ? h("p", null, rich(detail)) : null,
          h("p.caption", null, S.hints < (ex.hints || []).length ? "Prueba de nuevo o pide una pista." : "Puedes intentarlo otra vez o ver la solución.")]);
        maybeOfferSolution();
      }
    }
    function reveal() {
      S.revealed = true; P.reveal(id); setBadge(); showSolution(); if (opts.onChange) opts.onChange();
      say("info", [h("p.fb__t", null, "Solución"), h("p", null, rich(ex.explanation))]);
      lock(); btnSol.hidden = true;
    }

    /* ---------------- por tipo ---------------- */
    var T = {};

    T.choice = function () {
      var name = uid + "-opt", inputs = [];
      var set = h("fieldset.opts", null, h("legend.visually-hidden", null, ex.prompt));
      ex.options.forEach(function (o, i) {
        var inp = h("input", { type: "radio", name: name, id: name + i, value: o });
        inputs.push(inp);
        set.appendChild(h("label.opt", { for: name + i }, inp, h("span", null, rich(o))));
      });
      area.appendChild(set);
      var sel = function () { var c = inputs.filter(function (i) { return i.checked; })[0]; return c ? c.value : null; };
      return {
        check: function () {
          var v = sel(); if (v == null) return say("info", h("p", null, "Elige una opción para comprobar."));
          result(v === ex.correctAnswer, v === ex.correctAnswer ? null : (ex.why[v] || "Esa no es la respuesta correcta."));
        },
        solution: function () { inputs.forEach(function (i) { i.checked = i.value === ex.correctAnswer; if (i.checked) i.parentNode.classList.add("is-right"); i.disabled = true; }); },
        disable: function () { inputs.forEach(function (i) { i.disabled = true; }); }
      };
    };

    T.detection = function () {
      var picked = null, btns = [];
      var list = h("div.dlines", { role: "group", "aria-label": "Líneas del código: elige la que tiene el error" });
      ex.lines.forEach(function (ln, i) {
        var b = h("button.dline", { type: "button", "aria-pressed": "false" }, h("span.dline__n", null, String(i + 1)), h("span.dline__t", null, lineNodes(ln)));
        b.addEventListener("click", function () {
          if (S.locked) return; picked = i + 1;
          btns.forEach(function (x, k) { x.setAttribute("aria-pressed", String(k === i)); x.classList.toggle("is-picked", k === i); });
        });
        btns.push(b); list.appendChild(b);
      });
      area.appendChild(list);
      return {
        check: function () {
          if (picked == null) return say("info", h("p", null, "Pulsa la línea que crees que tiene el error."));
          result(picked === ex.correctAnswer, picked === ex.correctAnswer ? null : "La línea " + picked + " no es la que falla. Revisa de nuevo cada condición e índice.");
        },
        solution: function () { btns.forEach(function (x, k) { x.classList.toggle("is-right", k + 1 === ex.correctAnswer); x.disabled = true; }); },
        disable: function () { btns.forEach(function (x) { x.disabled = true; }); }
      };
    };
    function lineNodes(ln) { var c = L.ui.code(ln); return [].slice.call(c.querySelector(".cl__t").childNodes); }

    T.completar = function () {
      var selects = {};
      ex.blanks.forEach(function (b) {
        var sel = h("select.blank", { id: uid + "-b" + b.id, "aria-label": "Hueco " + b.id },
          h("option", { value: "" }, "…"), b.options.map(function (o) { return h("option", { value: o }, o); }));
        selects[b.id] = sel;
      });
      area.appendChild(L.ui.code(ex.template, { numbered: true, slots: selects }));
      return {
        check: function () {
          var wrong = [], empty = false;
          ex.blanks.forEach(function (b) {
            var v = selects[b.id].value;
            selects[b.id].classList.remove("is-bad", "is-good");
            if (!v) empty = true; else if (v !== b.answer) { wrong.push(b); selects[b.id].classList.add("is-bad"); } else selects[b.id].classList.add("is-good");
          });
          if (empty) return say("info", h("p", null, "Rellena todos los huecos para comprobar."));
          result(!wrong.length, wrong.length ? wrong.map(function (b) { var v = selects[b.id].value; return "Hueco " + b.id + ": " + (ex.why[v] || "`" + v + "` no es correcto aquí."); }).join(" ") : null);
        },
        solution: function () { ex.blanks.forEach(function (b) { selects[b.id].value = b.answer; selects[b.id].classList.add("is-good"); selects[b.id].disabled = true; }); },
        disable: function () { Object.keys(selects).forEach(function (k) { selects[k].disabled = true; }); }
      };
    };

    T.ordenar = function () {
      var n = ex.lines.length;
      var matches = function (order) { return ex.correctOrders.some(function (o) { return o.join() === order.join(); }); };
      var order = shuffled(n, id, matches);
      var list = h("ol.sortlist", { "aria-label": "Instrucciones: ordénalas con los botones" });
      var live = h("p.visually-hidden", { "aria-live": "polite" });
      function draw() {
        list.replaceChildren();
        order.forEach(function (orig, pos) {
          var up = h("button.mv", { type: "button", "aria-label": "Subir: " + ex.lines[orig].trim(), disabled: pos === 0 || S.locked }, "↑");
          var dn = h("button.mv", { type: "button", "aria-label": "Bajar: " + ex.lines[orig].trim(), disabled: pos === n - 1 || S.locked }, "↓");
          up.addEventListener("click", function () { swap(pos, pos - 1); });
          dn.addEventListener("click", function () { swap(pos, pos + 1); });
          list.appendChild(h("li.sortitem", null, h("span.sortitem__code", null, L.ui.code(ex.lines[orig].trim())), h("span.sortitem__btns", null, up, dn)));
        });
      }
      function swap(a, b) {
        var t = order[a]; order[a] = order[b]; order[b] = t; draw();
        live.textContent = "Movida a la posición " + (b + 1) + " de " + n + ".";
        var btn = list.children[b].querySelector(a < b ? "button:nth-of-type(2)" : "button:nth-of-type(1)");
        if (btn && !btn.disabled) btn.focus();
      }
      draw(); area.appendChild(list); area.appendChild(live);
      return {
        check: function () {
          if (matches(order)) return result(true);
          var best = 0;
          ex.correctOrders.forEach(function (o) { var c = 0; order.forEach(function (v, i) { if (o[i] === v) c++; }); best = Math.max(best, c); });
          result(false, "Hay **" + best + " de " + n + "** instrucciones en su sitio. Piensa qué debe existir antes de usarse.");
        },
        solution: function () { order = ex.correctOrders[0].slice(); S.locked = true; draw(); },
        disable: function () { draw(); }
      };
    };

    // Editor integrado en la lección: escribir, ejecutar, detener y comprobar sin salir de la pantalla.
    T.programacion = function () {
      var api = L.api, editor = null, mtime = null, busy = false, runId = null, saveTimer = null, javaReady = false;
      var gateSlot = h("div");
      var edWrap = h("div.inline-ed", { "aria-label": "Editor del ejercicio: " + ex.file });
      var out = h("pre.prog__out", { hidden: true, tabindex: "0", "aria-label": "Resultado de la ejecución" });
      var bRun = h("button.btn", { type: "button" }, "Ejecutar");
      var bStop = h("button.btn.btn--ghost", { type: "button", hidden: true }, "Detener");
      var bReset = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Restaurar enunciado");
      var bOpen = h("button.btn.btn--ghost.btn--sm", { type: "button" }, "Abrir en Code Space");
      var fileLbl = h("p.caption", null, "Archivo: ", h("code.inline", null, ex.file), " · se guarda solo al escribir.");

      area.appendChild(h("div.prog", null, gateSlot));

      if (!api.available) {   // abierto como archivo (file://): se muestra el enunciado pero no se puede ejecutar
        area.appendChild(L.ui.startCard());
        area.appendChild(L.ui.code(ex.starter, { numbered: true }));
        btnCheck.disabled = true;
        return { check: function () {}, solution: solutionBlock, disable: function () {} };
      }

      area.appendChild(fileLbl); area.appendChild(edWrap);
      area.appendChild(h("div.sim__row", null, bRun, bStop, bReset, bOpen));
      area.appendChild(out);
      function setBusy(b) { busy = b; bRun.disabled = b || !javaReady; btnCheck.disabled = b || !javaReady || S.locked; bStop.hidden = !b; }

      // Estado de Java + tarjeta de instalación
      setBusy(true);
      api.health().then(function (d) {
        javaReady = d.java.state === "ready";
        if (!javaReady) gateSlot.appendChild(L.ui.javaGate(d.java, function () { javaReady = true; setBusy(false); }));
        setBusy(false);
      }).catch(function (e) { gateSlot.appendChild(h("p.fb.fb--bad", null, e.message)); });

      // Carga (o crea) el archivo del ejercicio
      api.read(ex.file).catch(function (e) {
        if (e.code !== "NOT_FOUND") throw e;
        return api.write(ex.file, ex.starter, { createOnly: true }).then(function () { return api.read(ex.file); });
      }).then(function (r) {
        mtime = r.mtime;
        editor = L.CM.create(edWrap, { doc: r.content, onChange: function () { clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(true).catch(function () {}); }, 1200); }, onSave: function () { save(); } });
      }).catch(function (e) { say("bad", h("p", null, e.message)); });

      function save(quiet) {
        if (!editor) return Promise.resolve();
        var text = editor.getValue();
        return api.write(ex.file, text, { expectedMtime: mtime }).then(function (r) { mtime = r.mtime; }, function (e) {
          if (e.code !== "FILE_CHANGED_EXTERNALLY" || quiet) throw e;
          return ui_confirm().then(function (yes) {
            if (!yes) throw new L.ApiError("CANCELLED", "No se ha guardado.", 0);
            return api.write(ex.file, text, { force: true }).then(function (r) { mtime = r.mtime; });
          });
        });
      }
      function ui_confirm() { return L.ui.confirm("El archivo cambió en otro sitio", "«" + ex.file + "» se modificó (por ejemplo en Code Space). ¿Sobrescribirlo con lo que ves aquí?", "Sobrescribir"); }

      var line = function (text, cls) { out.appendChild(h("span" + (cls ? "." + cls : ""), null, text)); };
      function collect(id, after, buf) {
        return api.status(id, after).then(function (s) {
          s.chunks.forEach(function (c) { buf.push(c); line(c.text, c.stream === "stderr" ? "out__err" : c.stream === "system" ? "out__sys" : ""); });
          if (s.status === "running") return new Promise(function (r) { setTimeout(r, 150); }).then(function () { return collect(id, s.next, buf); });
          return { status: s.status, exitCode: s.exitCode, durationMs: s.durationMs, chunks: buf };
        });
      }
      // Guarda, compila solo este archivo y lo ejecuta. Devuelve null si no compila.
      function runProgram() {
        out.hidden = false; out.replaceChildren(); line("Compilando…\n", "out__sys"); setBusy(true);
        return save().then(function () { return api.compile(ex.file); }).then(function (c) {
          out.replaceChildren();
          if (!c.success) {
            c.diagnostics.slice(0, 3).forEach(function (d) { line(d.file + ":" + d.line + " — " + d.message + "\n", "out__err"); if (d.hint) line("Pista: " + d.hint + "\n", "out__sys"); });
            if (!c.diagnostics.length) line(c.stderr, "out__err");
            setBusy(false); return null;
          }
          return api.run(ex.file).then(function (r) {
            runId = r.runId;
            return collect(r.runId, 0, []).then(function (res) {
              runId = null; line("\n— " + ({ finished: "Terminó correctamente", failed: "Terminó con error", stopped: "Detenido", timeout: "Detenido por tiempo", error: "No pudo iniciarse" }[res.status] || res.status) + " en " + res.durationMs + " ms.\n", "out__sys");
              setBusy(false); return res;
            });
          });
        }).catch(function (e) { out.hidden = false; line((e.message || "Error") + "\n", "out__err"); setBusy(false); return null; });
      }

      bRun.addEventListener("click", function () { runProgram(); });
      bStop.addEventListener("click", function () { if (runId) api.stop(runId).catch(function () {}); });
      bReset.addEventListener("click", function () {
        L.ui.confirm("Restaurar el enunciado", "Se perderá lo que has escrito en este ejercicio y volverá al código inicial.", "Restaurar").then(function (yes) {
          if (yes && editor) { editor.setValue(ex.starter); save(); say("info", h("p", null, "Enunciado restaurado.")); }
        });
      });
      bOpen.addEventListener("click", function () { save().then(function () { L.state.set("openFile", ex.file); location.hash = "#/code-space"; }).catch(function (e) { say("bad", h("p", null, e.message)); }); });

      function solutionBlock() { area.appendChild(h("div", null, h("p.eyebrow", null, "Una posible solución"), L.ui.code(ex.solution, { numbered: true }))); }
      return {
        check: function () {
          say("info", h("p", null, "Comprobando tu programa…"));
          runProgram().then(function (res) {
            if (!res) return say("bad", [h("p.fb__t", null, "Todavía no compila."), h("p", null, "Revisa los mensajes de abajo: cada uno indica la línea y qué suele significar.")]);   // no cuenta como intento
            var text = res.chunks.filter(function (c) { return c.stream === "stdout"; }).map(function (c) { return c.text; }).join("");
            var ok = res.status === "finished" && norm(text) === norm(ex.expectedOutput);
            result(ok, res.status !== "finished" ? "El programa terminó con error o se detuvo." : "Tu programa imprime «" + norm(text) + "» y se esperaba «" + norm(ex.expectedOutput) + "».");
          });
        },
        solution: solutionBlock,
        disable: function () {}   // tras acertar se puede seguir ejecutando y probando
      };
    };

    var impl = null;
    impl = ({ prediction: T.choice, interpretation: T.choice, detection: T.detection, completar: T.completar, ordenar: T.ordenar, programacion: T.programacion })[ex.type]();
    function showSolution() { impl.solution(); }

    btnCheck.addEventListener("click", function () { impl.check(); });
    btnHint.addEventListener("click", function () {
      var hs = ex.hints || []; if (S.hints >= hs.length) return;
      S.hints++; P.hint(id, S.hints);
      hintList.appendChild(h("li", null, h("span.hint__n", null, "Pista " + S.hints), rich(hs[S.hints - 1])));
      updateHintBtn(); maybeOfferSolution();
    });
    btnSol.addEventListener("click", reveal);

    var fac = null;
    if (L.state.get("facilitator", false)) {
      fac = h("details.fac", null, h("summary", null, "Solución (modo facilitador)"),
        h("p", null, ex.type === "programacion" ? L.ui.code(ex.solution, { numbered: true }) : rich("Respuesta: **" + answerText(ex) + "**")), h("p", null, rich(ex.explanation)));
    }
    setBadge(); updateHintBtn();

    return h("section.ex", { "aria-labelledby": uid + "-t" },
      h("div.ex__head", null,
        h("p.eyebrow", null, TYPE[ex.type] + " · " + DIFF[ex.difficulty] + " · ~" + ex.estimatedMinutes + " min"), badge),
      h("h2.title.ex__title", { id: uid + "-t" }, rich(ex.title)),
      h("p.ex__prompt", null, rich(ex.prompt)),
      ex.code ? L.ui.code(ex.code, { numbered: true }) : null,
      area,
      h("div.ex__actions", null, btnCheck, btnHint, btnSol),
      hintList, fb, fac);
  }

  function answerText(ex) {
    if (ex.type === "detection") return "línea " + ex.correctAnswer + ": " + ex.lines[ex.correctAnswer - 1];
    if (ex.type === "completar") return ex.blanks.map(function (b) { return b.id + " → " + b.answer; }).join(", ");
    if (ex.type === "ordenar") return ex.correctOrders[0].map(function (i) { return ex.lines[i].trim(); }).join("  /  ");
    return String(ex.correctAnswer);
  }

  L.exercises = { render: render };
})(window.LoWKie = window.LoWKie || {});
