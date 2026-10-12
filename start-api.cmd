@echo off
chcp 65001 >nul
title Perry API (Product)
cd /d "%~dp0"

echo ========================================
echo   Perry - Product API
echo   http://localhost:5272
echo   Swagger: http://localhost:5272/swagger
echo ========================================
echo.

where dotnet >nul 2>&1
if errorlevel 1 (
  echo [!] .NET SDK not found. Install .NET 8 SDK:
  echo     https://dotnet.microsoft.com/download/dotnet/8.0
  echo.
  pause
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo [!] Docker not in PATH. Install Docker Desktop and retry.
  echo     https://www.docker.com/products/docker-desktop/
  echo.
  pause
  exit /b 1
)

echo [1/3] PostgreSQL (docker)...
docker info >nul 2>&1
if errorlevel 1 (
  echo [!] Docker Desktop is not running. Start it, wait until ready, retry.
  echo.
  pause
  exit /b 1
)

REM Reuse existing container if present (avoids "name already in use")
docker inspect perry-postgres >nul 2>&1
if not errorlevel 1 (
  for /f "tokens=*" %%S in ('docker inspect -f "{{.State.Running}}" perry-postgres 2^>nul') do set "_pg_run=%%S"
  if /i "%_pg_run%"=="true" (
    echo     Container perry-postgres already running - reuse.
    goto wait_pg_start
  )
  echo     Container perry-postgres exists but stopped - starting...
  docker start perry-postgres >nul
  if errorlevel 1 (
    echo     Start failed - recreate container...
    docker rm -f perry-postgres >nul 2>&1
    docker compose up -d postgres
    if errorlevel 1 goto pg_fail
  )
  goto wait_pg_start
)

docker compose up -d postgres
if errorlevel 1 (
  echo     Compose failed - remove old perry-postgres and retry...
  docker rm -f perry-postgres >nul 2>&1
  docker compose up -d postgres
  if errorlevel 1 goto pg_fail
)

:wait_pg_start
echo     Waiting for DB ready...
set /a _tries=0
:wait_pg
set /a _tries+=1
docker exec perry-postgres pg_isready -U perry -d perry >nul 2>&1
if not errorlevel 1 goto pg_ok
if %_tries% GEQ 40 (
  echo [!] Postgres not ready. Try: docker ps -a
  echo     Or: docker rm -f perry-postgres
  pause
  exit /b 1
)
timeout /t 1 /nobreak >nul
goto wait_pg

:pg_ok
echo     Postgres OK.
echo.

if not exist ".env" if exist ".env.example" (
  echo [2/3] No .env - copying .env.example
  copy /Y ".env.example" ".env" >nul
) else (
  echo [2/3] .env OK
)
REM If old .env still has PASTE_ placeholder, refresh JWT lines for local demo
findstr /C:"PASTE_AUTH_Jwt_SigningSecret_HERE" ".env" >nul 2>&1
if not errorlevel 1 (
  echo     Updating JWT placeholder in .env for local demo...
  powershell -NoProfile -Command "(Get-Content -Raw '.env') -replace 'PASTE_AUTH_Jwt_SigningSecret_HERE','changeme-dev-jwt-signing-key-32chars' | Set-Content -NoNewline '.env'"
)
echo.

echo [3/3] Starting Perry.Api...

REM Already running? (second click / leftover process)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5272/api/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 (
  echo     API already running on :5272 - nothing to start.
  echo     Swagger: http://localhost:5272/swagger
  start "" "http://localhost:5272/swagger"
  echo.
  pause
  exit /b 0
)

REM Port busy by a dead/stuck process - free it
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 5272 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1 }"

echo      Keep this window open. Stop: Ctrl+C
echo.
dotnet run --project src\Perry.Api --launch-profile http

echo.
echo API stopped.
pause
exit /b 0

:pg_fail
echo [!] Failed to start postgres.
echo     Quick fix: docker rm -f perry-postgres
echo     Then run this shortcut again.
pause
exit /b 1
