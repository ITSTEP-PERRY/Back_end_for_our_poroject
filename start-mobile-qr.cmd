@echo off
chcp 65001 >nul
title Perry Mobile (Expo Go / QR)
cd /d "%~dp0mobile"

echo ========================================
echo   Perry — Mobile (Expo Go + QR)
echo ========================================
echo.
echo 1) Expo Go на телефоне
echo 2) Тот же Wi-Fi, что и ПК
echo 3) Product API на :5272 ^(доступен по LAN^)
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [!] Нужен Node.js 18+ ^(npm^)
  pause
  exit /b 1
)

if not exist ".env" if exist ".env.example" (
  copy /Y ".env.example" ".env" >nul
)

if not exist "node_modules\" (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

set "TEMP=%~dp0.tmp"
set "TMP=%~dp0.tmp"
if not exist "%TEMP%" mkdir "%TEMP%"

call npx expo start --lan --clear

echo.
pause
