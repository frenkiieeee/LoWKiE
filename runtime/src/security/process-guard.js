"use strict";
const { execFile } = require("child_process");

// Detiene un proceso hijo y sus descendientes.
function killTree(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || !child.pid) return resolve();
    if (process.platform === "win32") {
      execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true }, () => resolve());
    } else {
      try { process.kill(-child.pid, "SIGKILL"); } catch (e) { try { child.kill("SIGKILL"); } catch (e2) { /* ya terminó */ } }
      resolve();
    }
  });
}
module.exports = { killTree };
