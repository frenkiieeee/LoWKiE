"use strict";
const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("../config/config");

// Log técnico local. Nunca se envía al navegador (spec §11.6).
function log(level, msg, err) {
  const line = `${new Date().toISOString()} [${level}] ${msg}${err ? " :: " + (err.stack || err) : ""}\n`;
  try {
    const dir = path.join(DATA_DIR, "logs");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "lowkie.log"), line);
  } catch (e) { /* sin log */ }
  if (level === "error") process.stderr.write(line);
}
module.exports = { info: (m) => log("info", m), error: (m, e) => log("error", m, e) };
