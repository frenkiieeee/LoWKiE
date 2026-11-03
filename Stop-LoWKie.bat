@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=%~dp0runtime\node\win-x64\node.exe"
if not exist "%NODE%" set "NODE=node"
"%NODE%" runtime\src\cli.js stop
echo.
pause
endlocal
