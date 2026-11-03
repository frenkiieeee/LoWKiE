import { build } from "esbuild";
await build({
  entryPoints: ["entry.js"], bundle: true, minify: true, format: "iife",
  target: "es2020", outfile: "../../app/vendor/codemirror.js", legalComments: "none"
});
console.log("OK → app/vendor/codemirror.js");
