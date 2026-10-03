# Creates "Perry API.lnk" in the repo root and on the user's Desktop.
# Prefer double-click: Создать-ярлык.cmd
# Or: powershell -ExecutionPolicy Bypass -File .\Install-Perry-Shortcuts.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$apiCmd = Join-Path $root "start-api.cmd"
if (-not (Test-Path -LiteralPath $apiCmd)) {
  throw "Не найден start-api.cmd рядом со скриптом: $apiCmd"
}

$sh = New-Object -ComObject WScript.Shell

$desktopDirs = @(
  [Environment]::GetFolderPath("Desktop"),
  (Join-Path $env:USERPROFILE "Desktop"),
  (Join-Path $env:USERPROFILE "OneDrive\Desktop"),
  (Join-Path $env:USERPROFILE "OneDrive\Рабочий стол")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

$dirs = @($root) + $desktopDirs | Select-Object -Unique
$created = @()

foreach ($dir in $dirs) {
  $path = Join-Path $dir "Perry API.lnk"
  $lnk = $sh.CreateShortcut($path)
  $lnk.TargetPath = $apiCmd
  $lnk.WorkingDirectory = $root
  $lnk.WindowStyle = 1
  $lnk.Description = "Perry Product API — PostgreSQL + :5272"
  $lnk.IconLocation = "shell32.dll,13"
  $lnk.Save()
  $created += $path
  Write-Host "OK  $path"
}

Write-Host ""
Write-Host "Ярлык готов. Запуск: двойной клик по «Perry API»"
Write-Host "  -> Postgres (Docker) + API  http://localhost:5272/swagger"
Write-Host "Нужны: Docker Desktop (запущен) и .NET 8 SDK."
Write-Host ""
Write-Host "Создано файлов: $($created.Count)"
