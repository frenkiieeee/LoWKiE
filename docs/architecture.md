# Arquitectura

```
Navegador ── HTTP en 127.0.0.1 ──► Servicio local (Node, sin dependencias) ──► javac / java (JDK real)
  index.html + app/                  runtime/src: rutas, servicios, seguridad
```

## Dos modos de uso
1. **Estático (`file://`)**: doble clic en `index.html`. Solo UI; Code Space avisa de que falta el servicio.
2. **Con servicio local**: el lanzador arranca `runtime/src/cli.js`, que sirve la misma UI por HTTP en loopback e
   inyecta un token de sesión en `index.html`. Solo así funcionan archivos y Java.

Restricciones para que el modo estático funcione: scripts clásicos (no ES modules), datos de ejemplo como `.js`
(no `fetch` de JSON), router por hash, `localStorage` en `try/catch`, sin CDN.

## Estructura
- `index.html`: en la raíz (la spec lo ponía en `app/`) para que sea obvio qué abrir.
- `app/`: interfaz. `scripts/` (estado, componentes, router, cliente API), `modules/` (una carpeta por pantalla),
  `styles/` (tokens, base, layout, componentes), `vendor/codemirror.js` (bundle local), `assets/fonts` (Poppins/Inter).
- `runtime/src/`: `server.js`, `cli.js`, `routes/` (API y estáticos), `services/` (workspace, files, java, progress),
  `security/` (token y Host/Origin, path-guard, process-guard), `config/`, `utils/`.
- `templates/projects/arrays/`: proyecto inicial copiado la primera vez a `Documentos/LoWKie/Projects/Arrays`.
- `scripts/`: `fetch-node.js`, `package.js`. `tools/editor-bundle/`: genera el bundle de CodeMirror.
- `tests/`: unitarias e integración (`pnpm test`).

## Decisiones y desviaciones de la especificación
| Decisión | Motivo / impacto |
|---|---|
| Multiplataforma (Windows, macOS, Linux) en vez de solo Windows 11 | Petición del proyecto. Lanzadores `.bat`, `.command` y `.sh`; selector de carpetas nativo por sistema. |
| Doble modo (`file://` + servicio) | La spec desaconseja `file://`; se mantiene solo para la parte sin Java ni archivos. |
| JDK mínimo 21 (acepta superiores) | Spec: Temurin 21 LTS. Probado con JDK 25. |
| Node incluido por plataforma, versión fijada en `scripts/fetch-node.js` | El alumno no instala Node. Se verifica SHA-256. |
| Compila **todos** los `.java` del proyecto; la clase principal sale de `package` + nombre de archivo | Funciona con cualquier estructura. Dos clases con el mismo nombre en carpetas distintas chocan (se explica en Problemas). |
| Salida de Java por *polling* (150 ms) en vez de SSE/WebSocket | Más simple y robusto; suficiente sin stdin. |
| Sin stdin interactivo | Permitido por spec §10.4; pendiente de diseño. |
| CodeMirror 6 (no Monaco) | Más ligero y fácil de empaquetar localmente. |

## Fase 2: experiencia de aprendizaje
- **Contenido** (`content/java/arrays/*.js`) separado de la interfaz; ver [content-authoring.md](content-authoring.md).
- **Learning Space** (`app/modules/learning`): lección = bloque de pasos (`#/leccion/<bloque>/<paso>`); teoría + código + simulador + actividad inmediata.
- **Simuladores** (`app/modules/simulators`): 1D y 2D (incluye filas irregulares) con selección, edición, tamaño fijo, índice fuera de rango y recorrido paso a paso; reutilizados dentro de las lecciones.
- **Ejercicios** (`app/modules/exercises`): seis tipos; solución solo tras intentar; pistas progresivas; los de programación se comprueban compilando y ejecutando con el JDK real.
- **Progreso y recomendaciones** (`app/scripts/progress.js`): se guarda siempre en `localStorage` y, con servicio, también en el perfil del usuario (gana el más reciente). Motor determinista basado en reglas de datos.
- **Modo facilitador**: notas docentes y soluciones visibles.
- Compilación aislada por archivo (`/api/java/compile {file}`): un ejercicio a medias no rompe la comprobación de otro.

## Programar integrado (0.1.2)
- Los ejercicios de programación tienen **editor propio dentro de la lección** (CodeMirror): se guarda solo, Ejecutar, Detener, Comprobar y Restaurar enunciado. «Abrir en Code Space» queda como opción secundaria.
- **Java sin instalar nada a mano**: `jdk-installer.js` descarga Temurin 21 (SHA-256 verificado) en `DATA_DIR/jdk`; `java-service.js` elige entre `JAVA_HOME`, el JDK portátil y el del sistema (gana el primero válido). `LOWKIE_IGNORE_SYSTEM_JAVA=1` fuerza el portátil.
- **Node** lo gestionan los lanzadores (`scripts/get-node.sh|ps1`); Java lo gestiona la propia aplicación, con la confirmación del usuario en pantalla.

## Pendiente / limitaciones conocidas
- Cerrar la ventana de terminal en Windows puede dejar un `java.exe` huérfano si había un programa en ejecución; el proceso se detiene por timeout (30 s) solo mientras el servicio vive.
- Navegación a una línea concreta desde «Problemas» (por ahora abre el archivo).
