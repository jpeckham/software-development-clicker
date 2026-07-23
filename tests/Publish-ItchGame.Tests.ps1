$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot 'scripts\Publish-ItchGame.ps1'

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Expected game upload helper at $scriptPath"
}

$script = Get-Content -LiteralPath $scriptPath -Raw
$requiredSnippets = @(
    'game',
    'dist\itchio\game',
    'index.html',
    '[string]$Target',
    'jheredparnell/software-development-clicker:html5',
    '--dry-run',
    'itch.io API error'
)

foreach ($snippet in $requiredSnippets) {
    if (-not $script.Contains($snippet)) {
        throw "Game upload helper is missing required snippet: $snippet"
    }
}

Write-Host 'Publish-ItchGame helper contract verified.'
