@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title LoWKie

rem 1) Node portatil del proyecto; 2) Node del sistema.
set "NODE=%~dp0runtime\node\win-x64\node.exe"
if exist "%NODE%" goto :havenode
where node >nul 2>&1
if not errorlevel 1 (set "NODE=node" & goto :havenode)

echo LoWKie necesita Node.js y no lo he encontrado.
echo Puedo descargar una copia portatil (unos 30 MB, desde nodejs.org, con verificacion de integridad).
echo Solo se guarda dentro de la carpeta de LoWKie: no instala nada en tu sistema.
set /p ANS="Descargarla ahora? [S/n] "
if /i "%ANS%"=="n" goto :nonode
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\get-node.ps1"
if errorlevel 1 goto :fail
set "NODE=%~dp0runtime\node\win-x64\node.exe"
if not exist "%NODE%" goto :nonode

:havenode
"%NODE%" -e "process.exit(Number(process.versions.node.split('.')[0]) < 20 ? 3 : 0)"
if errorlevel 3 goto :oldnode
"%NODE%" runtime\src\cli.js start
if errorlevel 1 goto :fail
goto :end

:nonode
echo.
echo Instala Node.js LTS desde https://nodejs.org/ y vuelve a abrir LoWKie.
goto :fail

:oldnode
echo.
echo Se necesita Node.js 20 o superior. Instala el LTS actual desde https://nodejs.org/

:fail
echo.
echo LoWKie no se ha podido iniciar.
pause
exit /b 1

:end
endlocal
