import {
  buyUpgrade,
  createFeature,
  createInitialState,
  debugDefects,
  getUpgradeCost,
  hydrateState,
  refactor,
  serializeState,
  shipRelease,
  tick,
  upgradeCatalog,
  writeCode,
  writeTests
} from './game.js';

const saveKey = 'software-development-clicker-save-v1';
const state = loadState();

const $ = (selector) => document.querySelector(selector);
const format = (value, digits = 0) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

function loadState() {
  try {
    const saved = localStorage.getItem(saveKey);
    return saved ? hydrateState(saved) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function persist() {
  localStorage.setItem(saveKey, serializeState(state));
}

function bindAction(selector, action) {
  $(selector).addEventListener('click', () => {
    action();
    persist();
    render();
  });
}

function renderStats() {
  const stats = [
    ['Lines of Code', format(state.loc, 1)],
    ['Features', format(state.features)],
    ['Revenue', `$${format(state.revenue)}`],
    ['Reputation', format(state.reputation, 2)],
    ['Customers', format(state.customers)],
    ['Defects', format(state.defects)],
    ['Technical Debt', format(state.technicalDebt, 1)],
    ['Test Coverage', `${format(state.testCoverage, 1)}%`],
    ['LOC / sec', format(state.locPerSecond, 1)],
    ['Tests / sec', format(state.testPerSecond, 1)]
  ];

  $('#stats').innerHTML = stats.map(([label, value]) => `
    <div class="stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join('');
}

function renderUpgrades() {
  $('#upgrades').innerHTML = Object.entries(upgradeCatalog).map(([key, upgrade]) => {
    const cost = getUpgradeCost(state, key);
    const count = state.upgrades[key];
    const disabled = state.revenue < cost ? 'disabled' : '';
    return `
      <button class="upgrade" data-upgrade="${key}" ${disabled}>
        <span>
          <strong>${upgrade.name}</strong>
          <small>${upgrade.description}</small>
        </span>
        <span class="price">$${format(cost)} (${count})</span>
      </button>
    `;
  }).join('');

  document.querySelectorAll('[data-upgrade]').forEach((button) => {
    button.addEventListener('click', () => {
      buyUpgrade(state, button.dataset.upgrade);
      persist();
      render();
    });
  });
}

function renderLog() {
  $('#log').innerHTML = state.log.map((entry) => `
    <li>
      <strong>${entry.title}</strong>
      <span>${entry.message}</span>
    </li>
  `).join('');
}

function renderBars() {
  $('#coverageBar').style.width = `${Math.min(100, state.testCoverage)}%`;
  $('#debtBar').style.width = `${Math.min(100, state.technicalDebt)}%`;
  $('#moraleBar').style.width = `${Math.min(100, state.morale)}%`;
}

function renderButtons() {
  $('#featureCost').textContent = `${format(state.nextFeatureCost)} LOC`;
  $('#refactorCooldown').textContent = state.refactorCooldown > 0 ? `${Math.ceil(state.refactorCooldown)}s` : '';
  $('#featureButton').disabled = state.loc < state.nextFeatureCost;
  $('#releaseButton').disabled = state.features <= 0;
  $('#debugButton').disabled = state.defects <= 0;
  $('#refactorButton').disabled = state.refactorCooldown > 0 || (state.loc < 25 && state.technicalDebt <= 0);
}

function render() {
  renderStats();
  renderUpgrades();
  renderLog();
  renderBars();
  renderButtons();
}

bindAction('#writeCodeButton', () => writeCode(state));
bindAction('#testButton', () => writeTests(state));
bindAction('#debugButton', () => debugDefects(state));
bindAction('#refactorButton', () => refactor(state));
bindAction('#featureButton', () => createFeature(state));
bindAction('#releaseButton', () => shipRelease(state));
bindAction('#resetButton', () => {
  localStorage.removeItem(saveKey);
  Object.assign(state, createInitialState());
});

setInterval(() => {
  tick(state, 1);
  persist();
  render();
}, 1000);

render();
