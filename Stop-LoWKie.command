#!/bin/sh
cd "$(dirname "$0")" || exit 1
./stop-lowkie.sh
printf "Pulsa Intro para cerrar… "; read -r _
