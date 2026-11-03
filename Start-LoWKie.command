#!/bin/sh
# Doble clic en macOS: abre una ventana de Terminal con LoWKie.
cd "$(dirname "$0")" || exit 1
exec ./start-lowkie.sh
