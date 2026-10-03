# Creates Desktop shortcuts for API / Desktop UI / Mobile.
# Double-click: Создать-ярлык.cmd

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$sh = New-Object -ComObject WScript.Shell

$targets = @(
  @{ Name = "Perry API.lnk";      Cmd = "start-api.cmd";     Icon = "shell32.dll,13" },
  @{ Name = "Perry Desktop.lnk";  Cmd = "start-desktop.cmd"; Icon = "shell32.dll,14" },
  @{ Name = "Perry Mobile.lnk";   Cmd = "start-mobile.cmd";  Icon = "shell32.dll,15" }
)

foreach ($t in $targets) {
  $cmdPath = Join-Path $root $t.Cmd
  if (-not (Test-Path -LiteralPath $cmdPath)) {
    throw "Не найден $($t.Cmd) в $root"
  }
}

$desktopDirs = @(
  [Environment]::GetFolderPath("Desktop"),
  (Join-Path $env:USERPROFILE "Desktop"),
  (Join-Path $env:USERPROFILE "OneDrive\Desktop"),
  (Join-Path $env:USERPROFILE "OneDrive\Рабочий стол")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

$dirs = @($root) + $desktopDirs | Select-Object -Unique

foreach ($dir in $dirs) {
  foreach ($t in $targets) {
    $cmdPath = Join-Path $root $t.Cmd
    $path = Join-Path $dir $t.Name
    $lnk = $sh.CreateShortcut($path)
    $lnk.TargetPath = $cmdPath
    $lnk.WorkingDirectory = $root
    $lnk.WindowStyle = 1
    $lnk.Description = $t.Name.Replace(".lnk", "")
    $lnk.IconLocation = $t.Icon
    $lnk.Save()
    Write-Host "OK  $path"
  }
}

Write-Host ""
Write-Host "Ярлыки готовы:"
Write-Host "  Perry API      -> http://localhost:5272/swagger"
Write-Host "  Perry Desktop  -> http://localhost:3000   (Figma UI)"
Write-Host "  Perry Mobile   -> http://localhost:8081"
Write-Host ""
Write-Host "Сначала API, потом Desktop/Mobile. Нужны: Docker, .NET 8, Node.js 18+."
