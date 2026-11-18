@echo off
chcp 65001 >nul
title AutoCV 2.0 - Estudio ATS, CRM e Disparo Inteligente
color 0b

echo ==============================================================
echo      AUTOCV 2.0 - ESTUDIO ATS, CRM E DISPARO INTELIGENTE
echo ==============================================================
echo.
echo  [*] Inicializando ambiente...
echo  [*] Para encerrar o servidor, basta fechar esta janela.
echo ==============================================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
  echo  [*] Dependencias nao encontradas. Instalando (npm install)...
  call npm install
)

if not exist "dist\index.html" (
  echo  [*] Compilando interface pela primeira vez...
  call npm run build
)

start "" http://localhost:3002
node server/server.js

pause
