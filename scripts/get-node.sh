#!/bin/sh
# Descarga Node.js (portable, sin instalar) en runtime/node/<plataforma>/ y verifica su SHA-256.
# Lo invoca start-lowkie.sh cuando no hay Node. Uso manual: sh scripts/get-node.sh
VERSION="v24.22.1"   # Node 24 LTS (mantener igual que scripts/fetch-node.js)
cd "$(dirname "$0")/.." || exit 1

case "$(uname -s)" in Darwin) OS=darwin ;; Linux) OS=linux ;; *) echo "Sistema no compatible: $(uname -s)"; exit 1 ;; esac
case "$(uname -m)" in arm64|aarch64) ARCH=arm64 ;; x86_64|amd64) ARCH=x64 ;; *) echo "Arquitectura no compatible: $(uname -m)"; exit 1 ;; esac
PLAT="$OS-$ARCH"; FILE="node-$VERSION-$PLAT.tar.gz"; URL="https://nodejs.org/dist/$VERSION"
command -v curl >/dev/null 2>&1 || { echo "Hace falta 'curl' para descargar Node.js."; exit 1; }

TMP="$(mktemp -d)" || exit 1
trap 'rm -rf "$TMP"' EXIT
echo "Descargando Node.js $VERSION ($PLAT)…"
curl -fL --progress-bar -o "$TMP/$FILE" "$URL/$FILE" || { echo "No se pudo descargar. ¿Hay conexión a Internet?"; exit 1; }
curl -fsSL -o "$TMP/SHASUMS256.txt" "$URL/SHASUMS256.txt" || { echo "No se pudo descargar la suma de verificación."; exit 1; }

EXPECTED="$(grep "  $FILE\$" "$TMP/SHASUMS256.txt" | cut -d' ' -f1)"
if command -v sha256sum >/dev/null 2>&1; then ACTUAL="$(sha256sum "$TMP/$FILE" | cut -d' ' -f1)"; else ACTUAL="$(shasum -a 256 "$TMP/$FILE" | cut -d' ' -f1)"; fi
if [ -z "$EXPECTED" ] || [ "$EXPECTED" != "$ACTUAL" ]; then echo "La verificación de integridad ha fallado. No se instala nada."; exit 1; fi

tar -xzf "$TMP/$FILE" -C "$TMP" || exit 1
mkdir -p runtime/node && rm -rf "runtime/node/$PLAT" && mv "$TMP/node-$VERSION-$PLAT" "runtime/node/$PLAT" || exit 1
echo "Node.js listo en runtime/node/$PLAT"
