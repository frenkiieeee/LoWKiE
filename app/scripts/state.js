/* Estado mínimo persistido en localStorage. Todo acceso va en try/catch:
   en modo privado o con el almacenamiento bloqueado la app sigue funcionando. */
(function (L) {
  var KEY = "lowkie:v0.1.0:state";
  var memory = {};

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return memory; }
  }
  function write(obj) {
    memory = obj;
    try { window.localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* sin persistencia */ }
  }

  L.state = {
    get: function (k, fallback) { var s = read(); return k in s ? s[k] : fallback; },
    set: function (k, v) { var s = read(); s[k] = v; write(s); }
  };
})(window.LoWKie = window.LoWKie || {});
