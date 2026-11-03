#!/bin/sh
# Lanzador de LoWKie para macOS y Linux.
# Si no tienes permiso de ejecución (p. ej. tras bajar el ZIP de GitHub), usa:  sh start-lowkie.sh
cd "$(dirname "$0")" || exit 1

case "$(uname -s)" in Darwin) OS=darwin ;; Linux) OS=linux ;; *) OS=unknown ;; esac
case "$(uname -m)" in arm64|aarch64) ARCH=arm64 ;; x86_64|amd64) ARCH=x64 ;; *) ARCH=unknown ;; esac
pause() { printf "\nPulsa Intro para cerrar… "; read -r _; }

find_node() {
  NODE="./runtime/node/$OS-$ARCH/bin/node"      # 1) Node portátil del proyecto
  [ -x "$NODE" ] || NODE="$(command -v node 2>/dev/null)"   # 2) Node del sistema
}
find_node

if [ -z "$NODE" ]; then
  echo "LoWKie necesita Node.js y no lo he encontrado."
  echo "Puedo descargar una copia portátil (unos 30 MB, desde nodejs.org, con verificación de integridad)."
  echo "Solo se guarda dentro de la carpeta de LoWKie: no instala nada en tu sistema."
  printf "¿Descargarla ahora? [S/n] "; read -r ans
  case "$ans" in n|N|no|NO) echo "De acuerdo. Instala Node.js LTS desde https://nodejs.org/ y vuelve a abrir LoWKie."; pause; exit 1 ;; esac
  sh scripts/get-node.sh || { pause; exit 1; }
  find_node
  [ -n "$NODE" ] || { echo "Sigo sin encontrar Node.js."; pause; exit 1; }
fi

MAJOR="$("$NODE" -p "process.versions.node.split('.')[0]" 2>/dev/null)"
if [ -z "$MAJOR" ] || [ "$MAJOR" -lt 20 ]; then
  echo "Se necesita Node.js 20 o superior (encontrado: $("$NODE" -v 2>/dev/null))."
  pause; exit 1
fi

"$NODE" runtime/src/cli.js start
STATUS=$?
[ $STATUS -ne 0 ] && { echo "LoWKie terminó con un error."; pause; }
exit $STATUS
