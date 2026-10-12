#Requires -Version 5.1
<#
.SYNOPSIS
  Sequential vibe-prompts runner: copies each prompt to the clipboard.

.EXAMPLE
  .\run-vibe-sequence.ps1
  .\run-vibe-sequence.ps1 -From 06
  .\run-vibe-sequence.ps1 -Reset
  .\run-vibe-sequence.ps1 -List
#>
[CmdletBinding()]
param(
  [string] $From = "",
  [switch] $Reset,
  [switch] $List,
  [switch] $NoOpen,
  [switch] $IncludeOneShot
)

$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$StatePath = Join-Path $Root ".vibe-sequence-state.json"

$StackRules = @"
Perry rules:
- Write working code, not pseudocode.
- Auth Service is external - do not rebuild full Auth from scratch.
- Product API has NO Users table - only UserId (Guid) from JWT.
- Desktop: frontend/ Vite :3000. Mobile: mobile/ Expo :8081. API :5272 + Swagger. Postgres Docker.
- UI copy in English. Docs may be Russian.
- Product 401 is NOT "log in as Admin". AuthorName must NOT be JWT sub (GUID).
- Register: confirmPassword -> verify-email -> complete-registration -> login (no JWT on step 1).
- For tricky spots read vibe-prompts/PITFALLS.md.
"@

$Steps = @(
  @{ Id = "pitfalls"; File = "PITFALLS.md"; Title = "Pitfalls / guardrails" }
  @{ Id = "00"; File = "00-vision.md"; Title = "Product vision" }
  @{ Id = "01"; File = "01-backend-skeleton.md"; Title = "Product API skeleton" }
  @{ Id = "02"; File = "02-catalog-pdp.md"; Title = "Catalog and PDP" }
  @{ Id = "03"; File = "03-cart-checkout-orders.md"; Title = "Cart and orders" }
  @{ Id = "04"; File = "04-reviews-wishlist.md"; Title = "Reviews and wishlist" }
  @{ Id = "05"; File = "05-auth-jwt-bridge.md"; Title = "JWT / Auth bridge" }
  @{ Id = "06"; File = "06-desktop-vite.md"; Title = "Desktop Vite" }
  @{ Id = "07"; File = "07-desktop-auth-ui.md"; Title = "Desktop Auth UI" }
  @{ Id = "08"; File = "08-admin-panel.md"; Title = "Admin panel" }
  @{ Id = "09"; File = "09-mobile-expo.md"; Title = "Mobile Expo" }
  @{ Id = "10"; File = "10-figma-polish.md"; Title = "Figma polish" }
  @{ Id = "11"; File = "11-seed-media-run.md"; Title = "Seed and local run" }
  @{ Id = "12"; File = "12-smoke-and-defense.md"; Title = "Smoke and defense" }
)

if ($IncludeOneShot) {
  $Steps += @{ Id = "99"; File = "99-one-shot-full.md"; Title = "One-shot (optional)" }
}

function Get-TextPromptFromMarkdown([string] $Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  $rx = [regex]::new('(?s)```text\r?\n(.*?)```')
  $ms = $rx.Matches($raw)
  if ($ms.Count -eq 0) { return $null }
  $best = $ms | Sort-Object { $_.Groups[1].Value.Length } -Descending | Select-Object -First 1
  return $best.Groups[1].Value.Trim()
}

function Save-State([string] $NextId) {
  @{
    updatedAtUtc = [DateTime]::UtcNow.ToString("o")
    nextId       = $NextId
  } | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding UTF8
}

function Read-State {
  if (-not (Test-Path -LiteralPath $StatePath)) { return $null }
  try {
    return Get-Content -LiteralPath $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch { return $null }
}

function Set-ClipboardText([string] $Text) {
  try {
    Set-Clipboard -Value $Text
    return $true
  } catch {
    try {
      Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
      [System.Windows.Forms.Clipboard]::SetText($Text)
      return $true
    } catch {
      Write-Host "  [!] Clipboard failed: $($_.Exception.Message)" -ForegroundColor Yellow
      return $false
    }
  }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Perry vibe-prompts sequence" -ForegroundColor Cyan
Write-Host "  Folder: $Root" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Each step copies a prompt to the clipboard." -ForegroundColor Gray
Write-Host "Paste into Cursor Agent (Ctrl+V), wait, then press Enter." -ForegroundColor Gray
Write-Host "Keys: Enter = next | S = skip | Q = quit" -ForegroundColor Gray
Write-Host ""

if ($Reset -and (Test-Path -LiteralPath $StatePath)) {
  Remove-Item -LiteralPath $StatePath -Force
  Write-Host "Progress reset." -ForegroundColor Yellow
}

if ($List) {
  $i = 1
  foreach ($s in $Steps) {
    $exists = Test-Path -LiteralPath (Join-Path $Root $s.File)
    $mark = if ($exists) { "OK" } else { "MISSING" }
    Write-Host ("{0,2}. [{1}] {2,-10} {3}" -f $i, $mark, $s.Id, $s.Title)
    $i++
  }
  exit 0
}

$startIndex = 0
if ($From) {
  $idx = 0..($Steps.Count - 1) | Where-Object { $Steps[$_].Id -eq $From } | Select-Object -First 1
  if ($null -eq $idx) {
    Write-Host "Unknown -From '$From'. Allowed: $($Steps.Id -join ', ')" -ForegroundColor Red
    exit 1
  }
  $startIndex = [int]$idx
} else {
  $st = Read-State
  if ($st -and $st.nextId -and $st.nextId -ne "done") {
    $idx = 0..($Steps.Count - 1) | Where-Object { $Steps[$_].Id -eq $st.nextId } | Select-Object -First 1
    if ($null -ne $idx) {
      $startIndex = [int]$idx
      Write-Host "Resuming from saved step: $($st.nextId)" -ForegroundColor Green
    }
  }
}

for ($i = $startIndex; $i -lt $Steps.Count; $i++) {
  $step = $Steps[$i]
  $path = Join-Path $Root $step.File
  $n = $i + 1
  $total = $Steps.Count

  Write-Host ""
  Write-Host "----------------------------------------" -ForegroundColor DarkCyan
  Write-Host (" Step {0}/{1}: [{2}] {3}" -f $n, $total, $step.Id, $step.Title) -ForegroundColor Cyan
  Write-Host (" File: {0}" -f $step.File) -ForegroundColor DarkGray
  Write-Host "----------------------------------------" -ForegroundColor DarkCyan

  if (-not (Test-Path -LiteralPath $path)) {
    Write-Host "  [!] File missing - skip." -ForegroundColor Red
    continue
  }

  $promptBody = Get-TextPromptFromMarkdown $path
  if (-not $promptBody) {
    Write-Host "  [!] No ```text block in file - skip." -ForegroundColor Red
    continue
  }

  $payload = @"
=== PERRY VIBE STEP [$($step.Id)] $($step.Title) ===
Source: vibe-prompts/$($step.File)
Complete THIS step only. Do not jump ahead to later prompts.

$StackRules

--- STEP PROMPT ---

$promptBody
"@

  $ok = Set-ClipboardText $payload
  if ($ok) {
    $len = $payload.Length
    Write-Host "  [OK] Prompt copied to clipboard ($len chars)." -ForegroundColor Green
  }

  if (-not $NoOpen) {
    try {
      Start-Process -FilePath $path -ErrorAction SilentlyContinue | Out-Null
      Write-Host "  [i] Opened markdown in default editor." -ForegroundColor DarkGray
    } catch {}
  }

  Write-Host ""
  Write-Host "  1) Open Cursor Agent chat" -ForegroundColor White
  Write-Host "  2) Ctrl+V paste the prompt" -ForegroundColor White
  Write-Host "  3) Wait until the step is done" -ForegroundColor White
  Write-Host "  4) Enter = next | S = skip | Q = quit" -ForegroundColor White
  Write-Host ""

  $nextId = if ($i + 1 -lt $Steps.Count) { $Steps[$i + 1].Id } else { "done" }
  Save-State $step.Id

  while ($true) {
    Write-Host -NoNewline "  > "
    $key = Read-Host
    $k = ""
    if ($null -ne $key) { $k = $key.Trim().ToUpperInvariant() }
    if ($k -eq "" -or $k -eq "N" -or $k -eq "Y") {
      Save-State $nextId
      break
    }
    if ($k -eq "S") {
      Write-Host "  Skip -> next." -ForegroundColor Yellow
      Save-State $nextId
      break
    }
    if ($k -eq "Q") {
      Save-State $step.Id
      Write-Host ""
      Write-Host "Stopped. Progress saved at step $($step.Id)." -ForegroundColor Yellow
      Write-Host "Resume: .\run-vibe-sequence.ps1" -ForegroundColor Gray
      Write-Host "Reset:  .\run-vibe-sequence.ps1 -Reset" -ForegroundColor Gray
      exit 0
    }
    Write-Host "  Use Enter / S / Q" -ForegroundColor DarkYellow
  }
}

Save-State "done"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sequence finished." -ForegroundColor Green
Write-Host "  Next: smoke checklist from step 12." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
