"use strict";
const { spawn } = require("child_process");

// Abre la URL local en el navegador por defecto. URL fija de loopback, sin shell.
function openBrowser(url) {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]] :
    process.platform === "win32" ? ["rundll32", ["url.dll,FileProtocolHandler", url]] :
    ["xdg-open", [url]];
  try {
    const c = spawn(cmd, args, { stdio: "ignore", detached: true, windowsHide: true });
    c.on("error", () => {});
    c.unref();
  } catch (e) { /* el usuario puede abrir la URL a mano */ }
}
module.exports = { openBrowser };
