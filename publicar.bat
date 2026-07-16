@echo off
cd /d "%~dp0"

echo ============================================
echo   Publicar mudancas do portfolio no GitHub
echo ============================================
echo.

set /p msg="Descreva rapidamente o que mudou (ex: Atualiza bio e materias): "
if "%msg%"=="" set msg=Atualiza portfolio

echo.
echo Enviando...
git add .
git commit -m "%msg%"
git push

echo.
echo ============================================
echo   Pronto! O site atualiza em alguns minutos.
echo ============================================
pause
