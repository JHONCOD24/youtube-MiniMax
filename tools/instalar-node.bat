@echo off
setlocal EnableExtensions
title Instalar Node.js - Mini MX YouTube

set "LOCAL_BASE=%LOCALAPPDATA%\MiniMXYouTube"
set "NODE_DIR=%LOCAL_BASE%\node"
set "ZIP=%LOCAL_BASE%\node-win-x64.zip"
set "VER=v22.16.0"
set "URL=https://nodejs.org/dist/%VER%/node-%VER%-win-x64.zip"

echo.
echo  Instalando Node.js %VER% para Mini MX YouTube...
echo  Destino: %NODE_DIR%
echo.

if exist "%NODE_DIR%\node.exe" (
  echo  Node.js ya esta instalado.
  "%NODE_DIR%\node.exe" --version
  goto :done
)

if not exist "%LOCAL_BASE%" mkdir "%LOCAL_BASE%"

echo  Descargando Node.js...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-WebRequest -Uri '%URL%' -OutFile '%ZIP%' -UseBasicParsing"
if errorlevel 1 (
  echo  [ERROR] No se pudo descargar Node.js.
  pause
  exit /b 1
)

echo  Extrayendo...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$tmp='%LOCAL_BASE%\extract'; if(Test-Path $tmp){Remove-Item $tmp -Recurse -Force}; Expand-Archive -Path '%ZIP%' -DestinationPath $tmp -Force; if(Test-Path '%NODE_DIR%'){Remove-Item '%NODE_DIR%' -Recurse -Force}; Move-Item (Join-Path $tmp 'node-%VER%-win-x64') '%NODE_DIR%' -Force; Remove-Item $tmp -Recurse -Force"

if not exist "%NODE_DIR%\node.exe" (
  echo  [ERROR] La instalacion fallo.
  pause
  exit /b 1
)

echo.
echo  Node.js instalado correctamente:
"%NODE_DIR%\node.exe" --version
"%NODE_DIR%\npm.cmd" --version

:done
echo.
echo  Listo. Ya puedes usar el acceso directo del escritorio.
echo.
pause