@echo off
chcp 65001 >nul
title Perry Desktop (Figma)
cd /d "%~dp0frontend"

echo ========================================
echo   Perry — Desktop (Vite / Figma)
echo   http://localhost:3000
echo ========================================
echo.
echo Нужен Product API на :5272  ^(start-api.cmd^)
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [!] Нужен Node.js 18+ ^(npm^)
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [!] Ставлю зависимости frontend...
  call npm install
  if errorlevel 1 (
    echo Ошибка npm install
    pause
    exit /b 1
  )
)

echo Запуск Vite...
call npm run dev

echo.
pause
