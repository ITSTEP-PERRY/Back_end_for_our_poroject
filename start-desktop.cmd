@echo off
chcp 65001 >nul
title Perry Desktop - React Vite
cd /d "%~dp0"

echo ========================================
echo   Perry Desktop = React + Vite (Figma)
echo   NOT Razor / NOT Perry.Web
echo   http://localhost:3000
echo ========================================
echo.
echo Need Product API on :5272  (start-api.cmd first)
echo Folder: %CD%\frontend
echo.

if not exist "%~dp0frontend\package.json" (
  echo [!] Missing frontend\package.json
  echo     Run: git pull
  echo     Repo must be Teslyar75/My_Amazon2
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0frontend"

where node >nul 2>&1
if errorlevel 1 (
  echo [!] Node.js NOT found in PATH.
  echo     Install LTS from https://nodejs.org/
  echo     Then CLOSE this window, open a NEW one, run again.
  echo.
  echo     Check in PowerShell:
  echo       node -v
  echo       npm -v
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [!] npm NOT found. Reinstall Node.js LTS and tick "Add to PATH".
  echo.
  pause
  exit /b 1
)

echo Node:
node -v
echo npm:
npm -v
echo.

if not exist "node_modules\" (
  echo [..] First run: npm install (may take a few minutes^)...
  call npm.cmd install
  if errorlevel 1 (
    echo [!] npm install FAILED
    echo     Free disk space, then retry.
    echo.
    pause
    exit /b 1
  )
  echo.
)

echo [..] Starting Vite on http://localhost:3000 ...
echo     Keep this window open.
echo.
call npm.cmd run dev
set "_ec=%ERRORLEVEL%"

echo.
if not "%_ec%"=="0" (
  echo [!] Vite exited with code %_ec%
  echo     Typical fixes:
  echo       1^) Install/reinstall Node.js LTS
  echo       2^) cd frontend ^& npm install
  echo       3^) Free disk space on C:
)
pause
exit /b %_ec%
