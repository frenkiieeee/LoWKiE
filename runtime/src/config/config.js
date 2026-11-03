"use strict";
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");

function dataDir() {
  if (process.env.LOWKIE_DATA_DIR) return path.resolve(process.env.LOWKIE_DATA_DIR);
  const home = os.homedir();
  if (process.platform === "win32") return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "LoWKie");
  if (process.platform === "darwin") return path.join(home, "Library", "Application Support", "LoWKie");
  return path.join(process.env.XDG_DATA_HOME || path.join(home, ".local", "share"), "LoWKie");
}

function projectsDir() {
  if (process.env.LOWKIE_PROJECTS_DIR) return path.resolve(process.env.LOWKIE_PROJECTS_DIR);
  return path.join(os.homedir(), "Documents", "LoWKie", "Projects");
}

module.exports = {
  VERSION: require("../../../package.json").version,
  ROOT,
  HOST: "127.0.0.1",
  PREFERRED_PORT: Number(process.env.LOWKIE_PORT) || 4173,
  PORT_TRIES: 20,
  DATA_DIR: dataDir(),
  PROJECTS_DIR: projectsDir(),
  TEMPLATES_DIR: path.join(ROOT, "templates", "projects"),
  // Solo estas rutas del repositorio se sirven como recursos estáticos.
  STATIC_ALLOW: ["index.html", "app", "content"],
  MIN_JAVA: 21,
  BUILD_DIR: ".lowkie-build",
  LIMITS: {
    bodyBytes: 5 * 1024 * 1024,
    fileBytes: 2 * 1024 * 1024,
    runOutputBytes: 1024 * 1024,
    runTimeoutMs: 30 * 1000,
    compileTimeoutMs: 60 * 1000,
    maxJavaFiles: 500,
    maxListEntries: 2000,
    progressBytes: 200 * 1024
  }
};
