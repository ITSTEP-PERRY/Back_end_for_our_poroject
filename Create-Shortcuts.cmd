@echo off
chcp 65001 >nul
title Perry - create shortcuts
cd /d "%~dp0"

echo ========================================
echo   Create shortcuts: API + Desktop + Mobile
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Perry-Shortcuts.ps1"
if errorlevel 1 (
  echo [!] Failed to create shortcuts.
  pause
  exit /b 1
)

echo.
echo Next:
echo   1^) Start Docker Desktop
echo   2^) Perry API
echo   3^) Perry Desktop and/or Perry Mobile
echo.
pause
