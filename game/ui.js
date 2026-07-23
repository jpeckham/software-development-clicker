import {
  buyUpgrade,
  createFeature,
  createInitialState,
  debugDefects,
  getDebtFeatureCostMultiplier,
  getEffectiveFeatureCost,
  getOperatingCost,
  getProductionDefectDrain,
  getRecurringRevenue,
  getReleaseEstimate,
  getUpgradeCost,
  hydrateState,
  maxTestCoverage,
  refactor,
  serializeState,
  sellUpgrade,
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
const formatMoney = (value) => `$${format(Math.abs(value))}`;
const formatSignedMoney = (value) => `${value < 0 ? '-' : ''}$${format(Math.abs(value), 2)}`;

function getUnfixedDefects() {
  return state.backlogDefects + Math.max(0, state.productionDefects - state.productionFixesPendingRelease);
}

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
  const netRevenuePerSecond = getRecurringRevenue(state) - getOperatingCost(state) - getProductionDefectDrain(state);
  const stats = [
    ['Lines of Code', format(state.loc, 1)],
    ['Features', format(state.features)],
    ['Revenue', formatSignedMoney(state.revenue)],
    ['Revenue / sec', formatSignedMoney(netRevenuePerSecond)],
    ['Reputation', format(state.reputation, 2)],
    ['Customers', format(state.customers)],
    ['Backlog Bugs', format(state.backlogDefects)],
    ['Production Bugs', format(state.productionDefects)],
    ['Fixes Pending', format(state.fixedDefectsPendingRelease)],
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
    const hireDisabled = state.revenue < cost ? 'disabled' : '';
    const fireDisabled = count <= 0 ? 'disabled' : '';
    return `
      <div class="upgrade">
        <span class="upgrade-copy">
          <strong>${upgrade.name}</strong>
          <small>${upgrade.description}</small>
        </span>
        <span class="staffing-controls">
          <button class="stepper" data-upgrade-down="${key}" ${fireDisabled} aria-label="Reduce ${upgrade.name}">-</button>
          <span class="price">$${format(cost)} (${count})</span>
          <button class="stepper" data-upgrade-up="${key}" ${hireDisabled} aria-label="Add ${upgrade.name}">+</button>
        </span>
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-upgrade-up]').forEach((button) => {
    button.addEventListener('click', () => {
      buyUpgrade(state, button.dataset.upgradeUp);
      persist();
      render();
    });
  });

  document.querySelectorAll('[data-upgrade-down]').forEach((button) => {
    button.addEventListener('click', () => {
      sellUpgrade(state, button.dataset.upgradeDown);
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
  $('#coverageBar').style.width = `${Math.min(100, (state.testCoverage / maxTestCoverage) * 100)}%`;
  $('#debtBar').style.width = `${Math.min(100, state.technicalDebt)}%`;
  $('#moraleBar').style.width = `${Math.min(100, state.morale)}%`;
}

function renderPressure() {
  const featureMultiplier = getDebtFeatureCostMultiplier(state);
  const featureCostIncrease = Math.round((featureMultiplier - 1) * 100);
  const debtDrag = Math.min(65, Math.round((state.technicalDebt / 350) * 100));
  const estimate = getReleaseEstimate(state);
  const coveragePrevention = Math.min(6, state.testCoverage / 10);
  const netRevenuePerSecond = getRecurringRevenue(state) - getOperatingCost(state) - getProductionDefectDrain(state);

  $('#featurePressure').textContent = `Feature cost from debt: +${featureCostIncrease}%`;
  $('#debtPressure').textContent = `LOC/sec lost to debt: -${debtDrag}%`;
  $('#releasePressure').textContent = state.features > 0 || state.fixedDefectsPendingRelease > 0
    ? `${estimate.earned < 0 ? 'Release loss' : 'Release revenue'}: ${formatMoney(estimate.earned)}; ${estimate.escapedDefects} bugs may escape`
    : 'Release estimate: finish a feature or pending fix first';
  $('#coveragePressure').textContent = `Net revenue/sec: ${formatSignedMoney(netRevenuePerSecond)}; coverage prevention: -${format(coveragePrevention, 1)}% risk`;
}

function renderButtons() {
  const featureCost = getEffectiveFeatureCost(state);
  const releaseEstimate = getReleaseEstimate(state);

  $('#featureCost').textContent = `${format(featureCost)} LOC`;
  $('#refactorCooldown').textContent = state.refactorCooldown > 0 ? `${Math.ceil(state.refactorCooldown)}s` : '';
  $('#featureButton').disabled = state.loc < featureCost;
  $('#releaseButton').disabled = state.features <= 0 && state.fixedDefectsPendingRelease <= 0;
  $('#debugButton').disabled = getUnfixedDefects() <= 0;
  $('#refactorButton').disabled = state.refactorCooldown > 0 || (state.loc < 25 && state.technicalDebt <= 0);

  $('#writeCodeHelp').textContent = `+${format(state.locPerClick)} LOC; may add a defect and debt`;
  $('#testHelp').textContent = state.testCoverage >= maxTestCoverage
    ? 'Best practical coverage reached; unknown risks remain'
    : `+2.5% coverage up to ${maxTestCoverage}%, -0.5 debt`;
  $('#debugHelp').textContent = getUnfixedDefects() > 0
    ? '+8 LOC per fix; production fixes need a release'
    : 'No known bugs to fix';
  $('#refactorHelp').textContent = state.refactorCooldown > 0
    ? `Cooldown: ${Math.ceil(state.refactorCooldown)}s`
    : state.loc < 25 && state.technicalDebt <= 0
      ? 'Need 25 LOC or existing debt'
      : 'Costs 25 LOC; -4 debt, +1 morale';
  $('#featureHelp').textContent = state.loc < featureCost
    ? `Need ${format(featureCost, 1)} LOC, have ${format(state.loc, 1)}`
    : 'Converts LOC into 1 feature; adds debt';
  $('#releaseHelp').textContent = state.features > 0
    ? `${releaseEstimate.earned < 0 ? 'Estimated loss' : 'Estimated revenue'}: ${formatMoney(releaseEstimate.earned)}`
    : state.fixedDefectsPendingRelease > 0
      ? `Hotfix ${format(state.fixedDefectsPendingRelease)} pending fix${state.fixedDefectsPendingRelease === 1 ? '' : 'es'}`
      : 'Need a completed feature or pending fix';
}

function render() {
  renderStats();
  renderUpgrades();
  renderLog();
  renderBars();
  renderPressure();
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
