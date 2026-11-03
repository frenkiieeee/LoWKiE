# API local

Prefijo `/api`, JSON. Todas las rutas salvo `GET /api/health` exigen la cabecera `X-LoWKie-Token`
(el token lo inyecta el servicio en `index.html`). Rutas de archivo: siempre relativas al proyecto abierto, con `/`.

Éxito: `{ "ok": true, ... }` · Error: `{ "ok": false, "error": { "code": "...", "message": "..." } }` (sin trazas ni rutas internas).

| Método y ruta | Descripción |
|---|---|
| `GET /api/health` | Versión del servicio y estado de Java (`ready`, `missing`, `no-jdk`, `old`). |
| `GET /api/workspace` · `POST /api/workspace/open` · `POST /api/workspace/default` | Proyecto activo; selector nativo de carpetas; proyecto inicial. |
| `GET /api/files?path=` | Lista un directorio. |
| `GET /api/file?path=` | Lee un archivo de texto (≤ 2 MB, no binario). Devuelve `content` y `mtime`. |
| `POST /api/file` `{path, content, createOnly?, expectedMtime?, force?}` | Crea/guarda. `409 FILE_CHANGED_EXTERNALLY` si cambió fuera de LoWKie y no hay `force`. |
| `PATCH /api/file` `{path, newPath}` · `DELETE /api/file?path=` · `POST /api/folder` `{path}` | Renombrar, eliminar (nunca la raíz), crear carpeta. |
| `POST /api/java/install` · `GET /api/java/install` | Instala un JDK 21 portátil (Temurin) en el perfil del usuario / consulta el progreso (`status`: idle·running·done·error, `phase`, `percent`). Lo inicia el botón de la interfaz. |
| `POST /api/java/compile` `{file?}` | Sin `file`: compila todo el proyecto en `.lowkie-build/`. Con `file`: solo ese archivo y las clases que use (`-sourcepath`), ignorando otros archivos rotos. Devuelve `success`, `stdout`, `stderr`, `diagnostics[{file,line,message,hint}]`. |
| `POST /api/java/run` `{file}` | Ejecuta la clase principal de ese `.java` (exige compilación válida). Una ejecución a la vez. |
| `GET /api/java/status/:runId?after=N` | Estado y fragmentos de salida desde el índice `N`. |
| `POST /api/java/stop` `{runId}` | Detiene el proceso y sus descendientes. |
| `GET/PUT /api/progress` · `GET/PUT /api/settings` | Datos locales validados (solo claves y tipos conocidos). El progreso incluye `completed`, `attempts`, `correct`, `hints`, `revealed`, `steps`. |
| `POST /api/shutdown` | Cierre ordenado (lo usa `Stop-LoWKie`). |

Códigos habituales: `SESSION_INVALID`, `HOST_NOT_ALLOWED`, `ORIGIN_NOT_ALLOWED`, `WORKSPACE_PATH_INVALID`, `NOT_COMPILED`, `RUN_ACTIVE`, `JAVA_UNAVAILABLE`.
