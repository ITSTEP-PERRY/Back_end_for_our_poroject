@echo off
chcp 65001 >nul
title Perry API (Product)
cd /d "%~dp0"

echo ========================================
echo   Perry — Product API
echo   http://localhost:5272
echo   Swagger: http://localhost:5272/swagger
echo ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [!] Docker не найден. Нужен PostgreSQL на localhost:5432
  echo     либо установите Docker Desktop и повторите.
  echo.
) else (
  echo [1/2] PostgreSQL ^(docker compose^)...
  docker compose up -d postgres
  if errorlevel 1 (
    echo [!] Не удалось поднять postgres. Проверьте Docker Desktop.
    pause
    exit /b 1
  )
  echo.
)

if not exist ".env" if exist ".env.example" (
  echo [i] Нет .env — копирую из .env.example
  copy /Y ".env.example" ".env" >nul
)

echo [2/2] Запуск Perry.Api...
echo.
dotnet run --project src\Perry.Api --launch-profile http

echo.
pause
