@echo off
chcp 65001 >nul
title Perry — создать ярлыки
cd /d "%~dp0"

echo ========================================
echo   Ярлыки: API + Desktop + Mobile
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Perry-Shortcuts.ps1"
if errorlevel 1 (
  echo [!] Ошибка создания ярлыков.
  pause
  exit /b 1
)

echo.
echo Дальше:
echo   1^) Запустите Docker Desktop
echo   2^) Perry API
echo   3^) Perry Desktop и/или Perry Mobile
echo.
pause
