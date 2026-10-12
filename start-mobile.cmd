@echo off
chcp 65001 >nul
title Perry Mobile (Expo)
cd /d "%~dp0mobile"

echo ========================================
echo   Perry — Mobile (Expo Web)
echo   http://localhost:8081
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

if not exist ".env" if exist ".env.example" (
  echo [i] Копирую mobile\.env.example -^> .env
  copy /Y ".env.example" ".env" >nul
)

if not exist "node_modules\" (
  echo [!] Ставлю зависимости mobile...
  call npm install
  if errorlevel 1 (
    echo Ошибка npm install
    pause
    exit /b 1
  )
)

set "TEMP=%~dp0.tmp"
set "TMP=%~dp0.tmp"
if not exist "%TEMP%" mkdir "%TEMP%"

echo Запуск Expo Web на порту 8081...
call npx expo start --web --port 8081 --clear

echo.
pause
