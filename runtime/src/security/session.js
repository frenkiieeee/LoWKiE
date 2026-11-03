"use strict";
const crypto = require("crypto");
const { AppError } = require("../utils/errors");

const token = crypto.randomBytes(32).toString("hex");

function tokenEquals(candidate) {
  if (typeof candidate !== "string") return false;
  const a = Buffer.from(candidate), b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Solo se acepta Host de loopback con el puerto real del servicio (anti DNS-rebinding).
function checkHost(req, port) {
  const host = (req.headers.host || "").toLowerCase();
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
    throw new AppError("HOST_NOT_ALLOWED", "Host no permitido.", 403);
  }
}
function checkOrigin(req, port) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) {
    throw new AppError("ORIGIN_NOT_ALLOWED", "Origen no permitido.", 403);
  }
}
function requireToken(req) {
  if (!tokenEquals(req.headers["x-lowkie-token"])) {
    throw new AppError("SESSION_INVALID", "Sesión no válida. Abre LoWKie desde el lanzador.", 401);
  }
}
module.exports = { token, checkHost, checkOrigin, requireToken };
