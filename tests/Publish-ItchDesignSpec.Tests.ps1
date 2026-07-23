$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot 'scripts\Publish-ItchDesignSpec.ps1'

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Expected upload helper at $scriptPath"
}

$script = Get-Content -LiteralPath $scriptPath -Raw

$requiredSnippets = @(
    'docs\prompts\2026-07-23 Software_Development_Clicker_Design_Specification_v1.md',
    'dist\itchio\Software_Development_Clicker_Design_Specification_v1.zip',
    'jheredparnell/software-development-clicker:design-spec',
    '--dry-run',
    'butler_creds',
    'itch.io API error'
)

foreach ($snippet in $requiredSnippets) {
    if ($script -notlike "*$snippet*") {
        throw "Upload helper is missing required snippet: $snippet"
    }
}

Write-Host 'Publish-ItchDesignSpec helper contract verified.'
