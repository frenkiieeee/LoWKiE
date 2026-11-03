"use strict";
const fs = require("fs/promises");
const path = require("path");
const { AppError } = require("../utils/errors");

const bad = (msg) => new AppError("WORKSPACE_PATH_INVALID", msg || "La ruta no pertenece al proyecto activo.", 400);

function isInside(root, target) {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// Normaliza una ruta relativa del cliente ("src/Main.java") → absoluta dentro de root.
// Rechaza absolutas, "..", bytes nulos, barras invertidas ambiguas y enlaces simbólicos que escapen.
async function resolveInside(root, rel) {
  if (typeof rel !== "string") throw bad("Ruta no válida.");
  if (rel.includes("\0") || rel.includes("\\")) throw bad("Ruta no válida.");
  if (path.isAbsolute(rel) || /^[A-Za-z]:/.test(rel)) throw bad("No se permiten rutas absolutas.");
  const parts = rel.split("/").filter((p) => p !== "" && p !== ".");
  if (parts.includes("..")) throw bad("No se permite salir del proyecto.");

  const realRoot = await fs.realpath(root);
  const target = path.join(realRoot, ...parts);
  if (!isInside(realRoot, target)) throw bad();

  // Resuelve enlaces simbólicos del tramo existente más largo y comprueba que sigue dentro.
  let probe = target;
  for (;;) {
    try {
      const real = await fs.realpath(probe);
      if (!isInside(realRoot, real)) throw bad("Enlace simbólico fuera del proyecto.");
      break;
    } catch (e) {
      if (e instanceof AppError) throw e;
      if (e.code !== "ENOENT") throw e;
      const parent = path.dirname(probe);
      if (parent === probe) break;
      probe = parent;
    }
  }
  return { abs: target, rel: parts.join("/"), root: realRoot };
}

module.exports = { resolveInside, isInside };
