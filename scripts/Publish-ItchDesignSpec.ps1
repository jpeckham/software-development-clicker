param(
    [switch]$Publish,
    [string]$UserVersion = 'v1.0-2026-07-23',
    [string]$Identity = "$env:USERPROFILE\.config\itch\butler_creds"
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$specRelativePath = 'docs\prompts\2026-07-23 Software_Development_Clicker_Design_Specification_v1.md'
$zipRelativePath = 'dist\itchio\Software_Development_Clicker_Design_Specification_v1.zip'
$specPath = Join-Path $repoRoot $specRelativePath
$distRoot = Join-Path $repoRoot 'dist\itchio'
$packageDir = Join-Path $distRoot 'Software_Development_Clicker_Design_Specification_v1'
$packagedSpec = Join-Path $packageDir 'Software_Development_Clicker_Design_Specification_v1.md'
$zipPath = Join-Path $repoRoot $zipRelativePath
$butlerPath = Join-Path $repoRoot 'tools\butler\butler.exe'
$target = 'jheredparnell/software-development-clicker:design-spec'

if (-not (Test-Path -LiteralPath $specPath)) {
    throw "Missing design specification: $specPath"
}

if (-not (Test-Path -LiteralPath $butlerPath)) {
    throw "Missing butler executable: $butlerPath"
}

New-Item -ItemType Directory -Force -Path $packageDir | Out-Null
Copy-Item -LiteralPath $specPath -Destination $packagedSpec -Force
Compress-Archive -LiteralPath $packagedSpec -DestinationPath $zipPath -CompressionLevel Optimal -Force

$modeArgs = @('--dry-run')
if ($Publish) {
    if (-not (Test-Path -LiteralPath $Identity) -and [string]::IsNullOrWhiteSpace($env:BUTLER_API_KEY)) {
        throw "Cannot publish without itch.io credentials. Run tools\butler\butler.exe login or set BUTLER_API_KEY."
    }

    $modeArgs = @()
}

$butlerOutput = & $butlerPath push @modeArgs --assume-yes --context-timeout=8 --userversion=$UserVersion --identity=$Identity $zipPath $target 2>&1
$butlerExitCode = $LASTEXITCODE
$butlerOutput | ForEach-Object { Write-Host $_ }

if ($butlerExitCode -ne 0) {
    throw "Butler failed with exit code $butlerExitCode."
}

if (($butlerOutput -join "`n") -match 'itch\.io API error') {
    throw "Butler failed with an itch.io API error."
}
