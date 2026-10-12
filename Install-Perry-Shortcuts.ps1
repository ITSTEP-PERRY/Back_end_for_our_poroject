# Creates Desktop shortcuts: Perry API / Desktop / Mobile.
# Uses cmd.exe /k so the console window stays open.
# Run via: Create-Shortcuts.cmd

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$sh = New-Object -ComObject WScript.Shell
$comspec = $env:ComSpec
if ([string]::IsNullOrWhiteSpace($comspec)) { $comspec = "$env:SystemRoot\System32\cmd.exe" }

$targets = @(
  @{ Name = "Perry API.lnk";     Cmd = "start-api.cmd";     Icon = "shell32.dll,13" },
  @{ Name = "Perry Desktop.lnk"; Cmd = "start-desktop.cmd"; Icon = "shell32.dll,14" },
  @{ Name = "Perry Mobile.lnk";  Cmd = "start-mobile.cmd";  Icon = "shell32.dll,15" }
)

foreach ($t in $targets) {
  $cmdPath = Join-Path $root $t.Cmd
  if (-not (Test-Path -LiteralPath $cmdPath)) {
    throw "Missing file: $cmdPath"
  }
}

$desktopDirs = New-Object System.Collections.Generic.List[string]
foreach ($candidate in @(
    [Environment]::GetFolderPath("Desktop"),
    (Join-Path $env:USERPROFILE "Desktop"),
    (Join-Path $env:USERPROFILE "OneDrive\Desktop")
  )) {
  if ($candidate -and (Test-Path -LiteralPath $candidate) -and -not $desktopDirs.Contains($candidate)) {
    $desktopDirs.Add($candidate) | Out-Null
  }
}

$ruDesktop = "OneDrive\" + [string]::new(@(
  [char]0x0420, [char]0x0430, [char]0x0431, [char]0x043E, [char]0x0447, [char]0x0438,
  [char]0x0439, [char]0x0020, [char]0x0441, [char]0x0442, [char]0x043E, [char]0x043B
))
$ruPath = Join-Path $env:USERPROFILE $ruDesktop
if ((Test-Path -LiteralPath $ruPath) -and -not $desktopDirs.Contains($ruPath)) {
  $desktopDirs.Add($ruPath) | Out-Null
}

$dirs = @($root) + $desktopDirs.ToArray() | Select-Object -Unique

foreach ($dir in $dirs) {
  foreach ($t in $targets) {
    $cmdPath = Join-Path $root $t.Cmd
    $path = Join-Path $dir $t.Name
    $lnk = $sh.CreateShortcut($path)
    # /k keeps the window open if the script exits
    $lnk.TargetPath = $comspec
    $lnk.Arguments = "/k `"$cmdPath`""
    $lnk.WorkingDirectory = $root
    $lnk.WindowStyle = 1
    $lnk.Description = $t.Name.Replace(".lnk", "")
    $lnk.IconLocation = $t.Icon
    $lnk.Save()
    Write-Host "OK  $path"
  }
}

Write-Host ""
Write-Host "Shortcuts ready:"
Write-Host "  Perry API      -> http://localhost:5272/swagger"
Write-Host "  Perry Desktop  -> http://localhost:3000"
Write-Host "  Perry Mobile   -> http://localhost:8081"
Write-Host ""
Write-Host "Start API first, then Desktop/Mobile."
Write-Host "Need: Docker Desktop, .NET 8 SDK, Node.js 18+."
