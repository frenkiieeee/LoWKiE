/* Cliente de la API local. Si la página se abrió como archivo (file://), no hay servicio ni token:
   `available` es false y Code Space explica cómo iniciar LoWKie. */
(function (L) {
  var meta = document.querySelector('meta[name="lowkie-token"]');
  var token = meta ? meta.getAttribute("content") : null;

  function ApiError(code, message, status) {
    this.code = code; this.message = message; this.status = status;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function call(method, path, body) {
    if (!token) return Promise.reject(new ApiError("NO_SERVICE", "LoWKie no está conectado a su servicio local.", 0));
    var opts = { method: method, headers: { "X-LoWKie-Token": token } };
    if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: { code: "BAD_RESPONSE", message: "Respuesta no válida del servicio." } }; })
        .then(function (d) {
          if (!d.ok) throw new ApiError(d.error.code, d.error.message, r.status);
          return d;
        });
    }, function () { throw new ApiError("SERVICE_DOWN", "No se puede contactar con el servicio de LoWKie. ¿Sigue abierta su ventana?", 0); });
  }
  function q(params) {
    return Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
  }

  L.api = {
    available: !!token,
    health: function () { return call("GET", "/api/health"); },
    workspace: function () { return call("GET", "/api/workspace"); },
    openWorkspace: function () { return call("POST", "/api/workspace/open", {}); },
    list: function (p) { return call("GET", "/api/files?" + q({ path: p || "" })); },
    read: function (p) { return call("GET", "/api/file?" + q({ path: p })); },
    write: function (p, content, opts) { return call("POST", "/api/file", Object.assign({ path: p, content: content }, opts || {})); },
    mkdir: function (p) { return call("POST", "/api/folder", { path: p }); },
    rename: function (p, np) { return call("PATCH", "/api/file", { path: p, newPath: np }); },
    remove: function (p) { return call("DELETE", "/api/file?" + q({ path: p })); },
    installJava: function () { return call("POST", "/api/java/install", {}); },
    installStatus: function () { return call("GET", "/api/java/install"); },
    compile: function (file) { return call("POST", "/api/java/compile", file ? { file: file } : {}); },
    run: function (file) { return call("POST", "/api/java/run", { file: file }); },
    stop: function (runId) { return call("POST", "/api/java/stop", { runId: runId }); },
    status: function (runId, after) { return call("GET", "/api/java/status/" + runId + "?" + q({ after: after || 0 })); },
    getProgress: function () { return call("GET", "/api/progress"); },
    putProgress: function (p) { return call("PUT", "/api/progress", p); },
    getSettings: function () { return call("GET", "/api/settings"); },
    putSettings: function (s) { return call("PUT", "/api/settings", s); }
  };
  L.ApiError = ApiError;
})(window.LoWKie = window.LoWKie || {});
