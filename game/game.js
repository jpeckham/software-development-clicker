const logLimit = 8;
export const maxTestCoverage = 80;

export const upgradeCatalog = {
  juniorDev: {
    name: 'Junior Developer',
    cost: 55,
    locPerSecond: 1.5,
    defectRateBonus: 0.015,
    description: 'Adds steady LOC but needs review.'
  },
  seniorDev: {
    name: 'Senior Developer',
    cost: 240,
    locPerSecond: 4,
    defectRateBonus: -0.01,
    description: 'Ships faster and lowers defect pressure.'
  },
  qaEngineer: {
    name: 'QA Engineer',
    cost: 180,
    testPerSecond: 0.8,
    description: 'Raises coverage while you build.'
  },
  ciPipeline: {
    name: 'CI Pipeline',
    cost: 420,
    testPerSecond: 1.6,
    debtReduction: 0.02,
    description: 'Automates tests and chips away at debt.'
  },
  aiAssistant: {
    name: 'AI Assistant',
    cost: 760,
    locPerSecond: 10,
    defectRateBonus: 0.025,
    description: 'Huge output, hallucinations included.'
  }
};

const operatingCosts = {
  juniorDev: 0.4,
  seniorDev: 1.2,
  qaEngineer: 0.8,
  ciPipeline: 0.6,
  aiAssistant: 1.8
};

export function createInitialState() {
  return {
    loc: 0,
    totalLoc: 0,
    features: 0,
    releases: 0,
    revenue: 0,
    reputation: 1,
    customers: 0,
    defects: 0,
    backlogDefects: 0,
    productionDefects: 0,
    fixedDefectsPendingRelease: 0,
    productionFixesPendingRelease: 0,
    technicalDebt: 0,
    testCoverage: 0,
    morale: 100,
    locPerClick: 12,
    locPerSecond: 0,
    testPerSecond: 0,
    defectRateBonus: 0,
    refactorCooldown: 0,
    nextFeatureCost: 200,
    upgrades: Object.fromEntries(Object.keys(upgradeCatalog).map((key) => [key, 0])),
    eventTimer: 20,
    currentEvent: null,
    log: [{ title: 'Startup founded', message: 'One keyboard, one repo, zero process.' }]
  };
}

function normalizeDefectState(state) {
  state.backlogDefects ??= state.defects ?? 0;
  state.productionDefects ??= 0;
  state.fixedDefectsPendingRelease ??= 0;
  state.productionFixesPendingRelease ??= 0;
  state.defects = state.backlogDefects + state.productionDefects;
}

function addLog(state, title, message) {
  state.log.unshift({ title, message });
  state.log = state.log.slice(0, logLimit);
}

function defectChance(state) {
  const coverageReduction = Math.min(0.06, state.testCoverage / 1000);
  const debtPressure = Math.min(0.12, state.technicalDebt / 700);
  return Math.max(0.02, 0.09 + state.defectRateBonus + debtPressure - coverageReduction);
}

export function writeCode(state) {
  normalizeDefectState(state);
  const amount = state.locPerClick;
  state.loc += amount;
  state.totalLoc += amount;

  const defectAdded = defectChance(state) >= 0.09;
  if (defectAdded) {
    state.backlogDefects += 1;
    normalizeDefectState(state);
    state.technicalDebt += 1;
    addLog(state, 'Manual code', `You wrote ${amount} LOC and introduced a defect.`);
  } else {
    addLog(state, 'Manual code', `You wrote ${amount} clean LOC.`);
  }

  return state;
}

function recalculateProduction(state) {
  state.locPerSecond = 0;
  state.testPerSecond = 0;
  state.defectRateBonus = 0;

  for (const [key, count] of Object.entries(state.upgrades)) {
    const upgrade = upgradeCatalog[key];
    state.locPerSecond += (upgrade.locPerSecond ?? 0) * count;
    state.testPerSecond += (upgrade.testPerSecond ?? 0) * count;
    state.defectRateBonus += (upgrade.defectRateBonus ?? 0) * count;
  }
}

export function getUpgradeCost(state, key) {
  const upgrade = upgradeCatalog[key];
  return Math.ceil(upgrade.cost * Math.pow(1.18, state.upgrades[key]));
}

export function getDebtFeatureCostMultiplier(state) {
  return Number((1 + (state.technicalDebt / 100)).toFixed(2));
}

export function getEffectiveFeatureCost(state) {
  return Math.ceil(state.nextFeatureCost * getDebtFeatureCostMultiplier(state));
}

export function buyUpgrade(state, key) {
  normalizeDefectState(state);
  const cost = getUpgradeCost(state, key);
  if (state.revenue < cost) return false;

  state.revenue -= cost;
  state.upgrades[key] += 1;
  recalculateProduction(state);
  addLog(state, 'Upgrade purchased', `${upgradeCatalog[key].name} joined the org.`);
  return true;
}

export function sellUpgrade(state, key) {
  normalizeDefectState(state);
  if ((state.upgrades[key] ?? 0) <= 0) return false;

  state.upgrades[key] -= 1;
  recalculateProduction(state);
  addLog(state, 'Capacity reduced', `${upgradeCatalog[key].name} capacity was reduced.`);
  return true;
}

export function writeTests(state) {
  normalizeDefectState(state);
  state.testCoverage = Math.min(maxTestCoverage, state.testCoverage + 2.5);
  state.technicalDebt = Math.max(0, state.technicalDebt - 0.5);
  addLog(state, 'Tests added', 'Coverage rose and future defect risk dropped.');
  return state;
}

export function debugDefects(state) {
  normalizeDefectState(state);
  const unfixedProductionDefects = Math.max(0, state.productionDefects - state.productionFixesPendingRelease);
  const productionFixes = Math.min(2, unfixedProductionDefects);
  const backlogFixes = Math.min(2 - productionFixes, state.backlogDefects);
  const fixed = productionFixes + backlogFixes;

  if (fixed <= 0) return false;

  state.productionFixesPendingRelease += productionFixes;
  state.backlogDefects -= backlogFixes;
  state.fixedDefectsPendingRelease += fixed;
  state.loc += fixed * 8;
  state.totalLoc += fixed * 8;
  state.technicalDebt = Math.max(0, state.technicalDebt - 0.5);
  normalizeDefectState(state);
  addLog(state, 'Bugs fixed', `${fixed} fix${fixed === 1 ? '' : 'es'} coded and waiting for release.`);
  return true;
}

export function refactor(state) {
  normalizeDefectState(state);
  if ((state.refactorCooldown ?? 0) > 0) return false;
  if (state.loc < 25 && state.technicalDebt <= 0) return false;
  state.loc = Math.max(0, state.loc - 25);
  state.technicalDebt = Math.max(0, state.technicalDebt - 4);
  state.morale = Math.min(100, state.morale + 1);
  state.refactorCooldown = 12;
  addLog(state, 'Refactor', 'The codebase got easier to change.');
  return true;
}

export function createFeature(state) {
  normalizeDefectState(state);
  const featureCost = getEffectiveFeatureCost(state);
  if (state.loc < featureCost) return false;
  state.loc -= featureCost;
  state.features += 1;
  state.technicalDebt += 3;
  state.nextFeatureCost = Math.ceil(state.nextFeatureCost * 1.16);
  addLog(state, 'Feature complete', 'A shippable feature is ready for release.');
  return true;
}

export function getReleaseEstimate(state) {
  normalizeDefectState(state);
  const shipped = state.features;
  const grossRevenue = Math.round(shipped * 200 * (1 + (state.testCoverage / 100)));
  const defectPenalty = Math.round(state.backlogDefects * 15 * Math.max(1, shipped));
  const debtPenalty = Math.round(state.technicalDebt * 3);
  const earned = grossRevenue - defectPenalty - debtPenalty;
  const escapeRate = Math.max(0, Math.min(0.8, 0.5 + (state.technicalDebt / 200) - (state.testCoverage / 200)));
  const escapedDefects = shipped > 0 ? Math.floor(state.backlogDefects * escapeRate) : 0;
  const reputationDelta = Number(Math.max(-2, (earned / 200) - (escapedDefects * 0.08)).toFixed(2));

  return {
    shipped,
    grossRevenue,
    defectPenalty,
    debtPenalty,
    earned,
    reputationDelta,
    escapedDefects,
    fixedDefectsShipped: state.fixedDefectsPendingRelease
  };
}

export function shipRelease(state) {
  normalizeDefectState(state);
  if (state.features <= 0 && state.fixedDefectsPendingRelease <= 0) return false;

  const estimate = getReleaseEstimate(state);

  state.features = 0;
  state.releases += 1;
  state.revenue += estimate.earned;
  state.reputation = Math.max(0.2, Number((state.reputation + estimate.reputationDelta).toFixed(2)));
  state.customers = Math.max(0, state.customers + Math.max(0, Math.round(estimate.earned / 21)));
  state.backlogDefects = Math.max(0, state.backlogDefects - estimate.escapedDefects);
  state.productionDefects = Math.max(0, state.productionDefects - state.productionFixesPendingRelease) + estimate.escapedDefects;
  state.fixedDefectsPendingRelease = 0;
  state.productionFixesPendingRelease = 0;
  normalizeDefectState(state);
  addLog(
    state,
    'Release shipped',
    estimate.earned >= 0
      ? `Release ${state.releases} earned $${estimate.earned}.`
      : `Release ${state.releases} lost $${Math.abs(estimate.earned)}.`
  );
  return true;
}

export function getOperatingCost(state) {
  return Number(Object.entries(state.upgrades).reduce((total, [key, count]) => (
    total + ((operatingCosts[key] ?? 0) * count)
  ), 0).toFixed(2));
}

export function getRecurringRevenue(state) {
  return Number((state.customers * state.reputation * 0.05).toFixed(2));
}

export function getProductionDefectDrain(state) {
  normalizeDefectState(state);
  return Number((state.productionDefects * 3).toFixed(2));
}

const events = [
  {
    title: 'Merge conflict',
    message: 'A messy branch slows everyone down.',
    apply: (state) => {
      state.loc = Math.max(0, state.loc - 40);
      state.technicalDebt += 2;
    }
  },
  {
    title: 'Investor funding',
    message: 'Fresh runway, bigger expectations.',
    apply: (state) => {
      state.revenue += 250;
      state.reputation += 0.5;
    }
  },
  {
    title: 'Production outage',
    message: 'Customers noticed. Reliability work is overdue.',
    apply: (state) => {
      state.revenue = Math.max(0, state.revenue - 120);
      state.reputation = Math.max(0.2, Number((state.reputation - 0.8).toFixed(2)));
      state.productionDefects += 2;
      normalizeDefectState(state);
    }
  }
];

export function triggerEvent(state, index = Math.floor(Math.random() * events.length)) {
  const event = events[index % events.length];
  event.apply(state);
  state.currentEvent = event.title;
  state.eventTimer = 24;
  addLog(state, event.title, event.message);
  return event;
}

export function tick(state, seconds = 1) {
  normalizeDefectState(state);
  recalculateProduction(state);
  state.refactorCooldown = Math.max(0, Number(((state.refactorCooldown ?? 0) - seconds).toFixed(2)));
  const debtDrag = Math.max(0.35, 1 - (state.technicalDebt / 350));
  const locGain = Number((state.locPerSecond * seconds * debtDrag).toFixed(2));
  const testGain = Number((state.testPerSecond * seconds).toFixed(2));
  state.loc += locGain;
  state.totalLoc += locGain;
  state.testCoverage = Math.min(maxTestCoverage, Number((state.testCoverage + testGain).toFixed(2)));

  const ciCount = state.upgrades.ciPipeline ?? 0;
  if (ciCount > 0) {
    state.technicalDebt = Math.max(0, Number((state.technicalDebt - ciCount * 0.02 * seconds).toFixed(2)));
  }

  const netRevenuePerSecond = getRecurringRevenue(state) - getOperatingCost(state) - getProductionDefectDrain(state);
  state.revenue = Number((state.revenue + (netRevenuePerSecond * seconds)).toFixed(2));

  state.eventTimer -= seconds;
  if (state.eventTimer <= 0) triggerEvent(state);
  return state;
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function hydrateState(serialized) {
  const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  const state = createInitialState();
  Object.assign(state, parsed);
  if (parsed.defects != null && parsed.backlogDefects == null && parsed.productionDefects == null) {
    state.backlogDefects = parsed.defects;
    state.productionDefects = 0;
  }
  state.upgrades = { ...state.upgrades, ...(parsed.upgrades ?? {}) };
  normalizeDefectState(state);
  recalculateProduction(state);
  return state;
}
