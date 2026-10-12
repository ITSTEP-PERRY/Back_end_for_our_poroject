@echo off
chcp 65001 >nul
title Perry vibe-prompts sequence
cd /d "%~dp0"

echo.
echo  Perry — последовательный сценарий vibe-prompts
echo  Промпт копируется в буфер → вставь в Cursor Agent (Ctrl+V)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-vibe-sequence.ps1" %*
set ERR=%ERRORLEVEL%

echo.
if %ERR% neq 0 (
  echo  Скрипт завершился с кодом %ERR%.
) else (
  echo  Готово.
)
pause
exit /b %ERR%
