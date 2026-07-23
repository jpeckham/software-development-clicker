param(
    [switch]$Publish,
    [string]$UserVersion = 'v0.1.0-2026-07-23',
    [string]$Identity = "$env:USERPROFILE\.config\itch\butler_creds",
    [string]$ButlerPath,
    [string]$Target = 'jheredparnell/software-development-clicker:html5'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $repoRoot 'game'
$distRelativePath = 'dist\itchio\game'
$distDir = Join-Path $repoRoot $distRelativePath
$defaultButlerPath = Join-Path $repoRoot 'tools\butler\butler.exe'
$butlerPath = if ([string]::IsNullOrWhiteSpace($ButlerPath)) { $defaultButlerPath } else { $ButlerPath }
$requiredFiles = @('index.html', 'game.js', 'ui.js', 'styles.css')

if (-not (Test-Path -LiteralPath $sourceDir)) {
    throw "Missing game source directory: $sourceDir"
}

if (-not (Test-Path -LiteralPath $butlerPath)) {
    throw "Missing butler executable: $butlerPath"
}

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
foreach ($file in $requiredFiles) {
    $sourcePath = Join-Path $sourceDir $file
    if (-not (Test-Path -LiteralPath $sourcePath)) {
        throw "Missing game file: $sourcePath"
    }

    Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $distDir $file) -Force
}

$modeArgs = @('--dry-run')
if ($Publish) {
    if (-not (Test-Path -LiteralPath $Identity) -and [string]::IsNullOrWhiteSpace($env:BUTLER_API_KEY)) {
        throw "Cannot publish without itch.io credentials. Run tools\butler\butler.exe login or set BUTLER_API_KEY."
    }

    $modeArgs = @()
}

$identityArgs = @()
if (Test-Path -LiteralPath $Identity) {
    $identityArgs = @("--identity=$Identity")
}

$butlerOutput = & $butlerPath push @modeArgs --assume-yes --context-timeout=15 --userversion=$UserVersion @identityArgs $distDir $Target 2>&1
$butlerExitCode = $LASTEXITCODE
$butlerOutput | ForEach-Object { Write-Host $_ }

if ($butlerExitCode -ne 0) {
    throw "Butler failed with exit code $butlerExitCode."
}

if (($butlerOutput -join "`n") -match 'itch\.io API error') {
    throw "Butler failed with an itch.io API error."
}
