# Deployment

GitHub Actions runs CI on pull requests and pushes through the reusable
`jpeckham/.github/.github/workflows/continuous-delivery-itch-html5.yml@main`
workflow. It deploys the HTML5 game to itch.io on pushes to `main` and on
manual `workflow_dispatch` runs.

Each deploy also creates a GitHub release. The release version is the next
`v<major>.<minor>.<patch>` tag based on `version.json`, and the release includes
a zipped copy of the HTML5 game artifact plus release notes generated from git
commit history since the previous tag.

## Required GitHub Secret

Add this repository secret in GitHub under:

`Settings -> Secrets and variables -> Actions -> New repository secret`

- `BUTLER_API_KEY`: an itch.io API key that can upload builds with butler.

No extra secret is needed for GitHub Releases. The workflow uses GitHub's
built-in `GITHUB_TOKEN` with `contents: write` permission.

The workflow deploys to:

`jheredparnell/software-development-clicker:html5`

The major/minor release line is configured in:

`version.json`

## Local Dry Run

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\Publish-ItchGame.ps1
```

## Local Publish

```powershell
$env:BUTLER_API_KEY = '<itch-api-key>'
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\Publish-ItchGame.ps1 -Publish
```
