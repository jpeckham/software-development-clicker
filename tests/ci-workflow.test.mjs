import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/ci-cd.yml', 'utf8');

const requiredSnippets = [
  'name: CI/CD',
  'pull_request:',
  'push:',
  'branches: [ main ]',
  'workflow_dispatch:',
  'contents: write',
  'uses: jpeckham/.github/.github/workflows/continuous-delivery-itch-html5.yml@main',
  'main_branch: main',
  'node_version: "24"',
  'game_dir: game',
  'test_command: npm test',
  'version.json',
  'artifact_name_prefix: software-development-clicker',
  'itch_target: jheredparnell/software-development-clicker:html5',
  'BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}',
  'secrets:'
];

for (const snippet of requiredSnippets) {
  assert.ok(
    workflow.includes(snippet),
    `expected workflow to include ${JSON.stringify(snippet)}`
  );
}

console.log('ci workflow test passed');
