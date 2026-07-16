@echo off
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias pela primeira vez, aguarde...
  call npm install
  echo.
)

echo Iniciando o editor do portfolio...
echo (Esta janela precisa ficar aberta enquanto voce edita. Feche-a quando terminar.)
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3001/editor"

node server.js

pause
