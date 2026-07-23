# Deployment

GitHub Actions runs CI on pull requests and pushes. It deploys the HTML5 game
to itch.io on pushes to `main` and on manual `workflow_dispatch` runs.

## Required GitHub Secret

Add this repository secret in GitHub under:

`Settings -> Secrets and variables -> Actions -> New repository secret`

- `BUTLER_API_KEY`: an itch.io API key that can upload builds with butler.

The workflow deploys to:

`jheredparnell/software-development-clicker:html5`

## Local Dry Run

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\Publish-ItchGame.ps1
```

## Local Publish

```powershell
$env:BUTLER_API_KEY = '<itch-api-key>'
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\Publish-ItchGame.ps1 -Publish
```
