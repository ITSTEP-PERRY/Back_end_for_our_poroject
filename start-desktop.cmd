@echo off
setlocal EnableExtensions
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
echo Folder: %~dp0frontend
echo.

if not exist "%~dp0frontend\package.json" (
  echo [!] Missing frontend\package.json - run git pull
  goto :end
)

cd /d "%~dp0frontend"

where node >nul 2>&1
if errorlevel 1 (
  echo [!] Node.js NOT found in PATH.
  echo     Install LTS: https://nodejs.org/
  echo     Then close this window and try again.
  goto :end
)

echo Node:
node -v
echo.

if not exist "node_modules\vite\bin\vite.js" (
  echo [..] Installing dependencies (npm install^)...
  where npm >nul 2>&1
  if errorlevel 1 (
    echo [!] npm not found. Reinstall Node.js LTS.
    goto :end
  )
  call npm.cmd install
  if errorlevel 1 (
    echo [!] npm install FAILED. Free disk space and retry.
    goto :end
  )
)

if not exist "node_modules\vite\bin\vite.js" (
  echo [!] vite still missing after npm install
  goto :end
)

echo [..] Starting Vite via node on http://localhost:3000
echo     Keep this window open. Stop: Ctrl+C
echo.

REM Direct node avoids npm.cmd closing the console window
node "node_modules\vite\bin\vite.js"
echo.
echo Vite stopped (exit %ERRORLEVEL%).

:end
echo.
pause
endlocal
