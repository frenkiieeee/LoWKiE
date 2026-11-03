"use strict";
const fs = require("fs/promises");
const path = require("path");
const { DATA_DIR, LIMITS } = require("../config/config");
const { AppError } = require("../utils/errors");

const FILES = { progress: "progress.json", settings: "settings.json" };
const DEFAULTS = {
  progress: { version: 1, unit: "java-arrays", currentActivity: null, completed: [], attempts: {}, correct: {}, hints: {}, revealed: [], steps: [], reinforce: [], lastActivity: null, recommendationsShown: [] },
  settings: { version: 1, autosave: false, assistantVisible: true, lastWorkspace: null }
};

async function read(kind) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, FILES[kind]), "utf8");
    return Object.assign({}, DEFAULTS[kind], JSON.parse(raw));
  } catch (e) { return Object.assign({}, DEFAULTS[kind]); }
}

async function write(kind, obj) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, FILES[kind]);
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2), "utf8");
  await fs.rename(tmp, file);   // escritura atómica: no se pierde el progreso si se corta
}

// Solo se aceptan las claves conocidas y tipos esperados.
function validate(kind, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new AppError("BAD_REQUEST", "Datos no válidos.");
  if (JSON.stringify(body).length > LIMITS.progressBytes) throw new AppError("BODY_TOO_LARGE", "Datos demasiado grandes.", 413);
  const out = {};
  for (const key of Object.keys(DEFAULTS[kind])) {
    if (!(key in body)) continue;
    const def = DEFAULTS[kind][key], val = body[key];
    const okType = def === null ? (val === null || typeof val === "string")
      : Array.isArray(def) ? Array.isArray(val)
      : typeof def === "object" ? (val && typeof val === "object" && !Array.isArray(val))
      : typeof val === typeof def;
    if (!okType) throw new AppError("BAD_REQUEST", `Campo no válido: ${key}`);
    out[key] = val;
  }
  return out;
}

module.exports = {
  get: (kind) => read(kind),
  async put(kind, body) {
    const clean = validate(kind, body);
    const merged = Object.assign(await read(kind), clean);
    await write(kind, merged);
    return merged;
  },
  async patchSetting(key, value) { return module.exports.put("settings", { [key]: value }); }
};
