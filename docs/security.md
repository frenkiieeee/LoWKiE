# Seguridad

**Importante:** el código Java del alumno se ejecuta con los permisos del usuario del sistema. Esto **no es un sandbox**.
Úsese solo con código de ejercicios o del alumno bajo supervisión; no ejecutar código no confiable.

Medidas implementadas (con pruebas en `tests/`):
- El servicio escucha solo en `127.0.0.1`; valida `Host` y `Origin` (anti DNS-rebinding/CSRF).
- Token aleatorio por sesión (32 bytes) obligatorio en toda la API salvo `health`; comparación en tiempo constante.
- El token solo se inyecta en `index.html` servido por el propio servicio. El archivo `instance.json` (puerto, PID, token) es `0600`.
- Estáticos con lista blanca (`index.html`, `app/`, `content/`): `runtime/`, `docs/`, `.git/`… devuelven 404. CSP sin scripts remotos.
- Rutas de archivo: relativas, sin `..`, sin absolutas ni `\`, y `realpath` comprobado contra la raíz (bloquea enlaces simbólicos que escapen). Los enlaces no se listan.
- Java: `spawn` con argumentos separados, sin `shell`, solo `java`/`javac` fijos (o `JAVA_HOME`). La API no acepta líneas de comandos.
- Instalación de Java: solo si el usuario pulsa el botón; solo `https` y solo hosts de Adoptium/GitHub; el enlace debe ser de `github.com/adoptium/`; el SHA-256 publicado por la API se comprueba antes de extraer y no se instala nada si no coincide. Se guarda en el perfil del usuario, sin administrador. El Node portátil de los lanzadores se verifica igual.
- Límites: 30 s de ejecución, 1 MB de salida, 5 MB por petición, 2 MB por archivo, 500 archivos `.java`.
- Detener mata el árbol de procesos (grupo en Unix, `taskkill /T` en Windows).
- Sin telemetría ni servicios externos.
