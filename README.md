# LoWKiE
Education platform to learn code with a creative path

Entorno educativo para aprender a programar. **Unidad 1: Arrays en Java** (sesión guiada de 90 minutos):
teoría breve, simuladores visuales (arrays, matrices, ordenación y referencias), 50 ejercicios de seis tipos y un editor Java real
donde compilar y ejecutar tu código. **Avanzando** amplía la unidad con patrones, copias, ordenación, métodos, matrices y consejos.

---

## Para el alumno: cómo empezar

1. En GitHub pulsa **Code → Download ZIP** y **descomprime** la carpeta (no la abras desde dentro del ZIP).
2. **Solo leer, practicar con los simuladores y los ejercicios de test**: doble clic en **`index.html`**. No hace falta instalar nada.
3. **Para programar** (editor, ejecutar, comprobar) inicia LoWKie:

| Sistema | Cómo iniciar |
|---|---|
| **Windows** | doble clic en `Start-LoWKie.bat` |
| **macOS** | doble clic en `Start-LoWKie.terminal` (si macOS lo bloquea: clic derecho → Abrir) |
| **Linux** | en una terminal, dentro de la carpeta: `sh start-lowkie.sh` |

Funciona con el ZIP tal cual lo baja GitHub. En macOS, `Start-LoWKie.terminal` busca la carpeta de LoWKie en *Descargas*,
*Escritorio* y *Documentos*; si la tienes en otro sitio, o prefieres la terminal, abre `index.html`: la propia página detecta tu
sistema y te muestra el **comando exacto con tu ruta** y un botón «Copiar comando».

Eso es todo: el navegador se abre solo y **programas dentro de la propia lección**. La primera vez LoWKie te pregunta
antes de descargar lo que le falte, y lo hace por ti:
- **Node.js** (unos 30 MB), si tu equipo no lo tiene: en la ventana del lanzador, respondiendo `S`.
- **Java** (JDK 21, unos 190 MB): con el botón **«Instalar Java automáticamente»** que aparece cuando intentas programar.

Ambos se descargan de sus webs oficiales, se **verifican** con su suma SHA-256 y se guardan sin permisos de administrador
(Node en la carpeta de LoWKie; Java en tu perfil, así sobrevive si actualizas LoWKie). Si ya tienes Java 21+ instalado, se usa ese.
**Deja la ventana negra abierta mientras uses LoWKie**; ciérrala (o `Stop-LoWKie`) para terminar.

> Si Windows avisa con «SmartScreen», pulsa *Más información → Ejecutar de todas formas*.
> Tus proyectos y tu progreso se guardan fuera de esta carpeta (ver abajo).

### ¿Algo no funciona?
- **Sin conexión a Internet** la primera vez: no se puede descargar Node/Java; la parte de lectura y simuladores sigue funcionando.
- **«Para programar, inicia LoWKie»** en un ejercicio → abriste `index.html` directamente; usa el lanzador.
- **Java no se detecta tras instalarlo** → reinicia LoWKie (cierra la ventana negra y vuelve a iniciar).

---

## Para el profesor

- Activa **Modo facilitador** (abajo a la izquierda): muestra notas docentes por bloque y las soluciones.
- La unidad sigue la secuencia de 90 min: Diagnóstico → Arrays 1D → Operaciones → Arrays 2D → Bucles anidados → Laboratorio → Cierre.
  El alumno puede saltar entre pasos libremente (los puntos numerados de cada lección).
- Las soluciones solo se ofrecen al alumno **después de intentar** el ejercicio (o de gastar las pistas).
- **Progreso** muestra intentos, pistas y conceptos a reforzar; **Inicio** recomienda la siguiente actividad con reglas transparentes
  ([contenido editable](docs/content-authoring.md)).
- El código del alumno se ejecuta con los permisos de su usuario: **no es un sandbox** ([seguridad](docs/security.md)).

### Actualizar sin perder nada
Basta con **sustituir la carpeta de LoWKie por la nueva** (o volver a descargar el ZIP). Tu progreso, tus proyectos y el Java instalado viven fuera de esa carpeta (ver abajo),
y «Avanzando» se añade sin tocar la unidad base: lo que ya hiciste sigue igual. En **Progreso** hay además «Guardar copia de mi progreso» / «Cargar una copia»
(al cargar se **combina** con lo que ya tengas) para cambiar de ordenador o de navegador.

### Dónde se guardan los datos
- Proyectos: `Documentos/LoWKie/Projects/` (proyecto inicial `Arrays`, con los archivos de ejercicios).
- Progreso y ajustes: `%APPDATA%\LoWKie` (Windows) · `~/Library/Application Support/LoWKie` (macOS) · `~/.local/share/LoWKie` (Linux).
  Sin el servicio iniciado, el progreso se guarda en el navegador.

---

## Para desarrolladores

```
pnpm start                       # inicia el servicio y abre el navegador (el servicio no tiene dependencias)
pnpm test                        # 140+ pruebas: contenido (verificado con Java real), progreso, API, seguridad, instalador
pnpm package --platform=win-x64  # ZIP ligero por sistema, con Node incluido (mejor construirlo en macOS/Linux)
pnpm fetch-node all              # Node LTS verificado (SHA-256) para empaquetar
```
Gestor de paquetes: **pnpm** (≥ 11; `corepack enable` lo activa). Solo se necesita para regenerar el editor: el bundle de CodeMirror 6 está
versionado en `app/vendor/`, y se reconstruye con `pnpm install && pnpm build:editor`. **El alumno no necesita pnpm ni npm.**

Documentación: [arquitectura](docs/architecture.md) · [contenido](docs/content-authoring.md) · [API local](docs/api.md) ·
[seguridad](docs/security.md) · [empaquetado](docs/packaging.md) · [especificación](docs/LoWKie_Specification_v0.1.0.md).
Licencias de fuentes (OFL): `licenses/`.
