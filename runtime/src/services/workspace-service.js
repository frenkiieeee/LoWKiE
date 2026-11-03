"use strict";
const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const config = require("../config/config");
const progress = require("./progress-service");
const { AppError } = require("../utils/errors");

let current = null;   // { root, name }

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d); else await fs.copyFile(s, d);
  }
}

async function setRoot(root) {
  const real = await fs.realpath(root);
  const st = await fs.stat(real);
  if (!st.isDirectory()) throw new AppError("WORKSPACE_PATH_INVALID", "La ruta no es una carpeta.");
  current = { root: real, name: path.basename(real) };
  await progress.patchSetting("lastWorkspace", real);
  return info();
}

function info() { return current ? { name: current.name, root: current.root } : null; }

// Proyecto inicial «Arrays»: se crea una sola vez fuera de la carpeta de instalación (spec §12.2).
async function openDefault() {
  const dst = path.join(config.PROJECTS_DIR, "Arrays");
  try { await fs.access(dst); }
  catch (e) { await copyDir(path.join(config.TEMPLATES_DIR, "arrays"), dst); }
  return setRoot(dst);
}

async function restore() {
  const s = await progress.get("settings");
  if (s.lastWorkspace) { try { return await setRoot(s.lastWorkspace); } catch (e) { /* ya no existe */ } }
  return openDefault();
}

// Diálogo nativo de carpetas. Los comandos son fijos: nada del cliente llega al shell.
function pickFolder() {
  return new Promise((resolve, reject) => {
    let cmd, args;
    if (process.platform === "darwin") {
      cmd = "osascript"; args = ["-e", 'POSIX path of (choose folder with prompt "Elige la carpeta del proyecto")'];
    } else if (process.platform === "win32") {
      cmd = "powershell.exe";
      args = ["-NoProfile", "-STA", "-Command",
        "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description='Elige la carpeta del proyecto'; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath }"];
    } else {
      cmd = "zenity"; args = ["--file-selection", "--directory", "--title=Elige la carpeta del proyecto"];
    }
    const run = (c, a, onMissing) => execFile(c, a, { timeout: 5 * 60 * 1000, windowsHide: false }, (err, out) => {
      if (err && err.code === "ENOENT") return onMissing ? onMissing() : reject(new AppError("NO_DIALOG", "No hay un selector de carpetas disponible en este sistema.", 501));
      const p = String(out || "").trim();
      if (err || !p) return resolve(null);   // cancelado
      resolve(p);
    });
    if (process.platform === "linux") run(cmd, args, () => run("kdialog", ["--getexistingdirectory", require("os").homedir()]));
    else run(cmd, args);
  });
}

async function open() {
  const p = await pickFolder();
  if (!p) return { cancelled: true };
  return Object.assign({ cancelled: false }, await setRoot(p));
}

function requireRoot() {
  if (!current) throw new AppError("NO_WORKSPACE", "No hay ningún proyecto abierto.", 409);
  return current.root;
}

module.exports = { restore, openDefault, open, info, requireRoot };
