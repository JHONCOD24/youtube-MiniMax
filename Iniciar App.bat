@echo off
setlocal EnableExtensions
title Mini MX YouTube
cd /d "%~dp0"

set "NODE_DIR=%LOCALAPPDATA%\MiniMXYouTube\node"
set "NODE=%NODE_DIR%\node.exe"
set "NPM=%NODE_DIR%\npm.cmd"

if not exist "%NODE%" (
  echo.
  echo  [ERROR] Node.js no encontrado en:
  echo  %NODE_DIR%
  echo.
  echo  Ejecuta una vez:  tools\instalar-node.bat
  echo.
  pause
  exit /b 1
)

set "PATH=%NODE_DIR%;%PATH%"

if not exist "node_modules\" (
  echo Instalando dependencias ^(primera vez^)...
  call "%NPM%" install
  if errorlevel 1 goto :error
)
if not exist "backend\node_modules\" (
  call "%NPM%" install --prefix backend
  if errorlevel 1 goto :error
)
if not exist "frontend\node_modules\" (
  call "%NPM%" install --prefix frontend
  if errorlevel 1 goto :error
)

echo.
echo  Iniciando Mini MX YouTube...
echo  Backend:  http://localhost:4000
echo  Frontend: http://localhost:5173
echo.

start "Mini MX YouTube - Servidor" /MIN cmd /c "set PATH=%NODE_DIR%;%PATH% && "%NPM%" run dev"

echo Esperando que el servidor responda...
set /a INTENTOS=0
:wait_loop
set /a INTENTOS+=1
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://localhost:5173').StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto :open_browser
if %INTENTOS% GEQ 30 (
  echo.
  echo  El servidor tarda mas de lo normal. Abriendo el navegador igual...
  goto :open_browser
)
timeout /t 2 /nobreak >nul
goto :wait_loop

:open_browser
start "" "http://localhost:5173"
echo.
echo  App abierta. Deja la ventana del servidor minimizada en la barra de tareas.
echo  Para cerrar la app, cierra la ventana "Mini MX YouTube - Servidor".
echo.
timeout /t 4 /nobreak >nul
exit /b 0

:error
echo.
echo  [ERROR] No se pudieron instalar las dependencias.
echo  Revisa tu conexion a internet e intenta de nuevo.
echo.
pause
exit /b 1