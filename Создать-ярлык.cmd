@echo off
chcp 65001 >nul
title Perry — создать ярлык
cd /d "%~dp0"

echo ========================================
echo   Создание ярлыка «Perry API»
echo ========================================
echo.
echo После этого можно запускать проект
echo двойным кликом с рабочего стола.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Perry-Shortcuts.ps1"
if errorlevel 1 (
  echo.
  echo [!] Не удалось создать ярлык.
  pause
  exit /b 1
)

echo.
echo Готово. На рабочем столе: «Perry API»
echo Дальше: дважды кликните ярлык ^(Docker Desktop должен быть запущен^).
echo.
pause
