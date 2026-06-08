@echo off
title YouTube Niche Lab
cd /d "G:\Mi unidad\App\youtube-Mini Max\youtube-niche-lab"

echo Iniciando YouTube Niche Lab...
start "" /B npm run dev

echo Esperando que los servidores arranquen...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"

exit
