# Software Development Clicker

Software Development Clicker is a browser-based incremental management game about growing a software company one line of code at a time. You write code, turn LOC into features, ship releases, earn revenue, hire staff, adopt tools, and manage the drag from defects and technical debt.

The game is intentionally small and static: there is no build step, backend, account system, or framework runtime. The playable app lives in `game/` and runs directly in a browser when served over HTTP.

## Game Loop

1. Click **Write Code** to generate Lines of Code.
2. Use LOC to **Create Feature**.
3. **Ship Release** to convert completed features into revenue, customers, and reputation.
4. Spend revenue on staff and tools.
5. Keep defects and technical debt under control with tests, debugging, refactoring, and CI.

Technical debt and defects are meant to create real tradeoffs:

- More technical debt increases the LOC required to ship future features.
- More technical debt reduces passive LOC production.
- Backlog bugs are known before release and can escape into production if you ship too fast.
- Production bugs reduce revenue every second until fixed and shipped in a release or hotfix.
- Fixing bugs adds LOC because real fixes still have to be coded, reviewed, and shipped.
- Longer-lived bugs reduce release revenue and can make a bad release lose money.
- Test coverage lowers future defect risk.
- Test coverage caps at 80% because unknown unknowns always remain.
- Staff, tools, and AI assistance have ongoing operating costs.
- Hiring requires cash, but right-sizing staff or AI capacity is always available when count is above zero.

## Project Structure

- `game/index.html` - static HTML shell for the game.
- `game/styles.css` - dashboard, action, and responsive styles.
- `game/game.js` - core game state, mechanics, economy, and serialization.
- `game/ui.js` - DOM rendering, button bindings, local storage, and live estimates.
- `tests/game.test.mjs` - game simulation and economy tests.
- `tests/viewport.test.mjs` - browser layout smoke test.
- `tests/ci-workflow.test.mjs` - CI workflow validation.
- `scripts/serve-game.mjs` - local static server for development/debugging.
- `docs/` - design and deployment notes.

## Prerequisites

- Node.js 24 or newer is recommended.
- npm.
- VS Code, Chrome, or Microsoft Edge for browser debugging.

Install dependencies:

```powershell
npm install
```

## Run Locally

Start the local static server:

```powershell
npm run dev
```

Then open:

```text
http://127.0.0.1:4173/
```

The app uses browser `localStorage` for save data. Use the in-game **Reset** button or clear site data in your browser when testing a fresh run.

## Debug Locally In VS Code

This repo includes VS Code launch profiles in `.vscode/launch.json`.

1. Open the repo folder in VS Code.
2. Go to **Run and Debug**.
3. Choose either **Debug Game in Chrome** or **Debug Game in Edge**.
4. Press `F5`.

VS Code will run the **Serve game** background task, start `npm run dev`, and open the game at `http://127.0.0.1:4173/`.

Useful places to set breakpoints:

- `game/game.js` for mechanics like `writeCode`, `createFeature`, `shipRelease`, and `tick`.
- `game/ui.js` for rendering, button state, helper text, and local storage behavior.

If port `4173` is already in use, stop the other process or run the server manually with a different port:

```powershell
$env:PORT = "4174"
npm run dev
```

If you change the port manually, also update `.vscode/launch.json` before using the VS Code launch profiles.

## Run Tests

Run the full test suite:

```powershell
npm test
```

The test suite covers:

- Core simulation behavior.
- Technical debt and release revenue mechanics.
- Browser viewport fit at `1024x768`.
- CI workflow structure.

## Contributor Guide

Keep changes small and easy to test. This project is a prototype, but the economy can become hard to reason about quickly if mechanics are changed without tests.

Before opening a change:

1. Pull the latest branch.
2. Run `npm install` if dependencies changed.
3. Add or update tests for game-mechanic changes.
4. Run `npm test`.
5. Manually play the first few minutes locally.

When changing gameplay:

- Put reusable calculations in `game/game.js`.
- Keep UI estimates based on the same helpers used by actual game actions.
- Prefer visible player feedback over hidden rules.
- Update tests when balance rules change.
- Avoid adding dependencies unless the feature clearly needs them.

When changing UI:

- Check desktop and mobile layouts.
- Make disabled actions explain why they are disabled.
- Keep action text short enough to fit at `1024x768`.
- Avoid hiding important mechanics in the event log only.

## Current Development Focus

The prototype is currently strongest as a compact engineering-management clicker. The next high-value improvements are:

- More satisfying click feedback.
- Better unlock pacing.
- Clearer random events.
- More meaningful code review and architecture mechanics.
- Better balancing around AI productivity versus defect risk.
