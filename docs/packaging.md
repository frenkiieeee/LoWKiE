# Empaquetado y distribución

## A) Compartir el repositorio (ZIP de GitHub)
Es la vía principal. El ZIP no incluye Node ni conserva permisos de ejecución, así que:
- `index.html` funciona sin nada (teoría, simuladores, ejercicios no de programación).
- Los lanzadores piden confirmación y descargan un Node portátil verificado (SHA-256) con `scripts/get-node.sh` / `get-node.ps1`.
- **Sin `pnpm package`**: en macOS se inicia con doble clic en `Start-LoWKie.terminal` (un archivo de Terminal que no necesita permiso de ejecución y localiza la carpeta en Descargas/Escritorio/Documentos); en Linux con `sh start-lowkie.sh`. Además `index.html` detecta el sistema y muestra el comando exacto con la ruta real y un botón de copiar (`L.ui.startCard`). No hace falta `chmod`. `.gitattributes` fija CRLF en `.bat`/`.ps1` y LF en `.sh`.
- El JDK **no** va en el paquete: la aplicación ofrece instalarlo con un clic (ver architecture.md). Esto matiza la spec §13.5 (que pedía no instalar nada en silencio): aquí siempre hay confirmación explícita y verificación de integridad.

## B) ZIP de distribución con Node incluido
`pnpm package --platform=win-x64` (o `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`) genera un ZIP ligero (≈50 MB) con el Node de ese sistema y conserva los permisos de ejecución si se construye en macOS/Linux. Sin `--platform` incluye todos los Node descargados.

1. `pnpm fetch-node all` — descarga Node LTS (versión fijada en el script) para cada plataforma y verifica el SHA-256.
   Para reducir tamaño puedes pasar solo las que necesites (`darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `win-x64`).
2. `pnpm package` — crea `dist/LoWKie-v<versión>/` y su `.zip`.
3. Probar: descomprimir en otra carpeta y abrir el lanzador de cada sistema, sin Node ni conexión.

Notas:
- Construye el ZIP en macOS o Linux: así conserva los permisos de ejecución de `.sh` y `.command`. Un ZIP hecho en Windows no los conserva.
- No se firma ni se notariza: en macOS el primer arranque requiere clic derecho → Abrir; en Windows puede aparecer SmartScreen.
- El JDK no se incluye (spec §13.5): el lanzador solo lo detecta e indica cómo instalarlo.
- Estado de pruebas del paquete: ver el informe de la entrega (qué sistemas se han probado de verdad).
