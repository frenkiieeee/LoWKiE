import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "14px", color: "#172033", backgroundColor: "#FFFFFF" },
  ".cm-scroller": { fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace', lineHeight: "1.6" },
  ".cm-gutters": { backgroundColor: "#F6F8FC", color: "#566074", border: "none", borderRight: "1px solid #E5EAF2" },
  ".cm-activeLine": { backgroundColor: "#F6F8FC" },
  ".cm-activeLineGutter": { backgroundColor: "#E5EAF2" },
  "&.cm-focused": { outline: "none" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#165DFF" }
});

// API mínima para el resto de la app: LoWKie.CM.create(...)
function create(parent, opts) {
  const state = EditorState.create({
    doc: opts.doc || "",
    extensions: [
      basicSetup,
      java(),
      theme,
      keymap.of([
        indentWithTab,
        { key: "Mod-s", preventDefault: true, run: () => { opts.onSave && opts.onSave(); return true; } }
      ]),
      EditorView.updateListener.of((u) => { if (u.docChanged && opts.onChange) opts.onChange(); }),
      EditorView.contentAttributes.of({ "aria-label": "Editor de código Java" })
    ]
  });
  const view = new EditorView({ state, parent });
  return {
    getValue: () => view.state.doc.toString(),
    setValue: (text) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }),
    focus: () => view.focus(),
    destroy: () => view.destroy()
  };
}

window.LoWKie = window.LoWKie || {};
window.LoWKie.CM = { create };
