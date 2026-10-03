@echo off
chcp 65001 >nul
title Perry Desktop - React Vite
cd /d "%~dp0frontend"

echo ========================================
echo   Perry Desktop = React + Vite (Figma)
echo   NOT Razor / NOT Perry.Web
echo   http://localhost:3000
echo ========================================
echo.
echo Need Product API on :5272  (start-api.cmd)
echo.

if not exist "package.json" (
  echo [!] frontend\package.json missing. git pull the latest Teslyar75/My_Amazon2
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [!] Need Node.js 18+ (npm)
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed
    pause
    exit /b 1
  )
)

echo Starting Vite (React)...
call npm run dev

echo.
pause
