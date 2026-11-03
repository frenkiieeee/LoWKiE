#!/bin/sh
# Cierra LoWKie de forma ordenada (macOS y Linux).
cd "$(dirname "$0")" || exit 1
case "$(uname -s)" in Darwin) OS=darwin ;; Linux) OS=linux ;; *) OS=unknown ;; esac
case "$(uname -m)" in arm64|aarch64) ARCH=arm64 ;; x86_64|amd64) ARCH=x64 ;; *) ARCH=unknown ;; esac
NODE="./runtime/node/$OS-$ARCH/bin/node"
[ -x "$NODE" ] || NODE="$(command -v node 2>/dev/null)"
[ -n "$NODE" ] || { echo "No se encontró Node.js."; exit 1; }
"$NODE" runtime/src/cli.js stop
