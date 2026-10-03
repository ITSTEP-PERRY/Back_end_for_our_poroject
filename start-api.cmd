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

where dotnet >nul 2>&1
if errorlevel 1 (
  echo [!] Не найден .NET SDK. Установите .NET 8 SDK:
  echo     https://dotnet.microsoft.com/download/dotnet/8.0
  echo.
  pause
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo [!] Docker не найден в PATH.
  echo     Установите Docker Desktop и перезапустите ярлык.
  echo     https://www.docker.com/products/docker-desktop/
  echo.
  pause
  exit /b 1
)

echo [1/3] PostgreSQL ^(docker compose^)...
docker info >nul 2>&1
if errorlevel 1 (
  echo [!] Docker Desktop не запущен. Откройте Docker Desktop,
  echo     дождитесь зелёного статуса и снова кликните ярлык.
  echo.
  pause
  exit /b 1
)

docker compose up -d postgres
if errorlevel 1 (
  echo [!] Не удалось поднять postgres.
  pause
  exit /b 1
)

echo     Жду готовности БД...
set /a _tries=0
:wait_pg
set /a _tries+=1
docker compose exec -T postgres pg_isready -U perry -d perry >nul 2>&1
if not errorlevel 1 goto pg_ok
if %_tries% GEQ 30 (
  echo [!] Postgres не ответил за 30 попыток. Смотрите: docker compose ps
  pause
  exit /b 1
)
timeout /t 1 /nobreak >nul
goto wait_pg
:pg_ok
echo     Postgres OK.
echo.

if not exist ".env" if exist ".env.example" (
  echo [2/3] Нет .env — копирую из .env.example
  copy /Y ".env.example" ".env" >nul
) else (
  echo [2/3] .env на месте
)
echo.

echo [3/3] Запуск Perry.Api...
echo      Окно не закрывайте. Остановка: Ctrl+C
echo.
dotnet run --project src\Perry.Api --launch-profile http

echo.
echo API остановлен.
pause
