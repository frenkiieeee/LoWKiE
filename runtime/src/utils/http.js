"use strict";
const { AppError } = require("./errors");
const { LIMITS } = require("../config/config");

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(data);
}
const ok = (res, data) => sendJson(res, 200, Object.assign({ ok: true }, data || {}));
const fail = (res, e) => sendJson(res, e.status || 500, { ok: false, error: { code: e.code || "INTERNAL_ERROR", message: e.message } });

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > LIMITS.bodyBytes) { reject(new AppError("BODY_TOO_LARGE", "La petición es demasiado grande.", 413)); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(new AppError("BAD_JSON", "El cuerpo de la petición no es JSON válido.", 400)); }
    });
    req.on("error", reject);
  });
}
module.exports = { sendJson, ok, fail, readJson };
