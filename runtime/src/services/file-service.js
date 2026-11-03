"use strict";
const fs = require("fs/promises");
const path = require("path");
const { resolveInside } = require("../security/path-guard");
const { AppError } = require("../utils/errors");
const { LIMITS, BUILD_DIR } = require("../config/config");

const HIDDEN = new Set([BUILD_DIR, ".git", ".DS_Store"]);
const nameOk = (n) => n && n !== "." && n !== ".." && !/[\\/:*?"<>|\0]/.test(n) && n.length <= 120;

function checkName(rel) {
  const name = rel.split("/").pop();
  if (!nameOk(name)) throw new AppError("NAME_INVALID", "El nombre contiene caracteres no permitidos.");
}

async function list(root, rel) {
  const { abs } = await resolveInside(root, rel || "");
  let entries;
  try { entries = await fs.readdir(abs, { withFileTypes: true }); }
  catch (e) { throw new AppError("NOT_FOUND", "La carpeta no existe.", 404); }
  const out = [];
  for (const e of entries) {
    if (HIDDEN.has(e.name) || e.isSymbolicLink()) continue;   // no se siguen enlaces simbólicos
    if (!e.isDirectory() && !e.isFile()) continue;
    out.push({ name: e.name, type: e.isDirectory() ? "dir" : "file", path: [rel, e.name].filter(Boolean).join("/") });
    if (out.length >= LIMITS.maxListEntries) break;
  }
  out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
  return out;
}

async function read(root, rel) {
  const { abs } = await resolveInside(root, rel);
  let st;
  try { st = await fs.stat(abs); } catch (e) { throw new AppError("NOT_FOUND", "El archivo no existe.", 404); }
  if (!st.isFile()) throw new AppError("NOT_A_FILE", "No es un archivo.");
  if (st.size > LIMITS.fileBytes) throw new AppError("FILE_TOO_LARGE", "El archivo es demasiado grande para el editor.");
  const buf = await fs.readFile(abs);
  if (buf.includes(0)) throw new AppError("FILE_BINARY", "Es un archivo binario; el editor solo abre texto.");
  return { content: buf.toString("utf8"), mtime: st.mtimeMs };
}

async function write(root, rel, content, opts) {
  if (typeof content !== "string") throw new AppError("BAD_REQUEST", "Contenido no válido.");
  if (Buffer.byteLength(content) > LIMITS.fileBytes) throw new AppError("FILE_TOO_LARGE", "El archivo es demasiado grande.");
  checkName(rel);
  const { abs } = await resolveInside(root, rel);
  let st = null;
  try { st = await fs.stat(abs); } catch (e) { /* nuevo */ }
  if (st && st.isDirectory()) throw new AppError("NOT_A_FILE", "Ya existe una carpeta con ese nombre.");
  if (opts.createOnly && st) throw new AppError("ALREADY_EXISTS", "Ya existe un archivo con ese nombre.", 409);
  // No sobrescribir en silencio un archivo cambiado desde otra aplicación (spec §9.4).
  if (st && typeof opts.expectedMtime === "number" && Math.abs(st.mtimeMs - opts.expectedMtime) > 1 && !opts.force) {
    throw new AppError("FILE_CHANGED_EXTERNALLY", "El archivo ha cambiado fuera de LoWKie desde que lo abriste.", 409);
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
  return { mtime: (await fs.stat(abs)).mtimeMs };
}

async function mkdir(root, rel) {
  checkName(rel);
  const { abs } = await resolveInside(root, rel);
  try { await fs.mkdir(abs); } catch (e) {
    if (e.code === "EEXIST") throw new AppError("ALREADY_EXISTS", "Ya existe algo con ese nombre.", 409);
    throw e;
  }
}

async function rename(root, rel, newRel) {
  checkName(newRel);
  const a = await resolveInside(root, rel), b = await resolveInside(root, newRel);
  if (!a.rel) throw new AppError("WORKSPACE_PATH_INVALID", "No se puede renombrar la raíz.");
  try { await fs.stat(b.abs); throw new AppError("ALREADY_EXISTS", "Ya existe algo con ese nombre.", 409); }
  catch (e) { if (e instanceof AppError) throw e; }
  await fs.rename(a.abs, b.abs);
}

async function remove(root, rel) {
  const { abs, rel: clean } = await resolveInside(root, rel);
  if (!clean) throw new AppError("WORKSPACE_PATH_INVALID", "No se puede eliminar la raíz del proyecto.");
  await fs.rm(abs, { recursive: true, force: false });
}

module.exports = { list, read, write, mkdir, rename, remove };
