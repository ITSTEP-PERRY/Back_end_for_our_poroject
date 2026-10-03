# Creates / refreshes "Perry API" shortcut in the repo root and on the Desktop.
# Run after clone:
#   powershell -ExecutionPolicy Bypass -File .\Install-Perry-Shortcuts.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sh = New-Object -ComObject WScript.Shell

$apiCmd = Join-Path $root "start-api.cmd"
if (-not (Test-Path -LiteralPath $apiCmd)) { throw "Missing $apiCmd" }

$targets = @(
  @{ Name = "Perry API.lnk"; Target = $apiCmd; WorkDir = $root; Icon = "shell32.dll,13" }
)

$desktopDir = [Environment]::GetFolderPath("Desktop")
$dirs = @($root, $desktopDir) | Select-Object -Unique

foreach ($dir in $dirs) {
  foreach ($t in $targets) {
    $path = Join-Path $dir $t.Name
    $lnk = $sh.CreateShortcut($path)
    $lnk.TargetPath = $t.Target
    $lnk.WorkingDirectory = $t.WorkDir
    $lnk.WindowStyle = 1
    $lnk.Description = "Perry Product API :5272"
    $lnk.IconLocation = $t.Icon
    $lnk.Save()
    Write-Host "OK  $path"
  }
}

Write-Host ""
Write-Host "Shortcut ready. Double-click:"
Write-Host "  Perry API  -> http://localhost:5272/swagger"
Write-Host "Needs Docker Desktop (PostgreSQL) and .NET 8 SDK."
