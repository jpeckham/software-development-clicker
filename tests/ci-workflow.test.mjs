import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/ci-cd.yml', 'utf8');

const requiredSnippets = [
  'name: CI/CD',
  'pull_request:',
  'push:',
  'branches: [ main ]',
  'workflow_dispatch:',
  'npm ci',
  'npx playwright install chromium',
  'npm test',
  'BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}',
  'scripts/Publish-ItchGame.ps1',
  'jheredparnell/software-development-clicker:html5',
  'v0.1.${{ github.run_number }}-${{ github.sha }}'
];

for (const snippet of requiredSnippets) {
  assert.ok(
    workflow.includes(snippet),
    `expected workflow to include ${JSON.stringify(snippet)}`
  );
}

assert.ok(
  workflow.includes('if: github.event_name == \'workflow_dispatch\' || github.ref == \'refs/heads/main\''),
  'expected deploy job to run only on main or manual dispatch'
);

console.log('ci workflow test passed');
