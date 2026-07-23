import assert from 'node:assert/strict';
import {
  createInitialState,
  writeCode,
  writeTests,
  buyUpgrade,
  sellUpgrade,
  createFeature,
  debugDefects,
  getEffectiveFeatureCost,
  getOperatingCost,
  getProductionDefectDrain,
  getRecurringRevenue,
  getReleaseEstimate,
  refactor,
  shipRelease,
  tick,
  serializeState,
  hydrateState,
} from '../game/game.js';

const approx = (actual, expected, tolerance = 0.001) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
};

{
  const state = createInitialState();
  writeCode(state);

  assert.equal(state.loc, 12);
  assert.equal(state.totalLoc, 12);
  assert.equal(state.backlogDefects, 1);
  assert.equal(state.productionDefects, 0);
  assert.equal(state.technicalDebt, 1);
  assert.equal(state.log[0].message, 'You wrote 12 LOC and introduced a defect.');
}

{
  const state = createInitialState();
  state.revenue = 120;
  buyUpgrade(state, 'juniorDev');

  assert.equal(state.revenue, 65);
  assert.equal(state.upgrades.juniorDev, 1);
  assert.equal(state.locPerSecond, 1.5);
  assert.equal(state.defectRateBonus, 0.015);
}

{
  const state = createInitialState();
  state.revenue = -1000;
  state.upgrades.juniorDev = 1;
  state.upgrades.aiAssistant = 1;

  assert.equal(buyUpgrade(state, 'juniorDev'), false);
  assert.equal(sellUpgrade(state, 'juniorDev'), true);
  assert.equal(sellUpgrade(state, 'aiAssistant'), true);
  assert.equal(state.upgrades.juniorDev, 0);
  assert.equal(state.upgrades.aiAssistant, 0);
  assert.equal(sellUpgrade(state, 'juniorDev'), false);
  assert.equal(state.revenue, -1000);
}

{
  const state = createInitialState();
  state.technicalDebt = 25;

  assert.equal(getEffectiveFeatureCost(state), 250);

  state.loc = 249;
  assert.equal(createFeature(state), false);
  assert.equal(state.features, 0);

  state.loc = 250;
  assert.equal(createFeature(state), true);
  assert.equal(state.features, 1);
  assert.equal(state.loc, 0);
}

{
  const state = createInitialState();
  state.loc = 250;
  state.testCoverage = 10;
  createFeature(state);

  assert.equal(state.loc, 50);
  assert.equal(state.features, 1);
  assert.equal(state.technicalDebt, 3);
}

{
  const state = createInitialState();
  state.testCoverage = 79;

  writeTests(state);

  assert.equal(state.testCoverage, 80);
}

{
  const state = createInitialState();
  state.testCoverage = 79.5;
  state.upgrades.qaEngineer = 10;

  tick(state, 1);

  assert.equal(state.testCoverage, 80);
}

{
  const state = createInitialState();
  state.loc = 100;
  state.technicalDebt = 12;

  assert.equal(refactor(state), true);
  assert.equal(state.technicalDebt, 8);
  assert.equal(state.refactorCooldown, 12);
  assert.equal(refactor(state), false);
  assert.equal(state.technicalDebt, 8);

  tick(state, 11);
  assert.equal(refactor(state), false);
  assert.equal(state.technicalDebt, 8);

  tick(state, 1);
  assert.equal(refactor(state), true);
  assert.equal(state.technicalDebt, 4);
}

{
  const state = createInitialState();
  state.features = 1;
  state.backlogDefects = 20;
  state.technicalDebt = 10;

  const estimate = getReleaseEstimate(state);
  assert.equal(estimate.grossRevenue, 200);
  assert.equal(estimate.defectPenalty, 300);
  assert.equal(estimate.debtPenalty, 30);
  assert.equal(estimate.earned, -130);

  shipRelease(state);
  assert.equal(state.revenue, -130);
  assert.equal(state.customers, 0);
  assert.ok(state.reputation < 1);
}

{
  const state = createInitialState();
  state.features = 2;
  state.backlogDefects = 3;
  state.technicalDebt = 10;
  state.testCoverage = 20;
  shipRelease(state);

  assert.equal(state.features, 0);
  approx(state.revenue, 360);
  approx(state.reputation, 2.72);
  assert.equal(state.customers, 17);
}

{
  const state = createInitialState();
  state.productionDefects = 2;

  assert.equal(getProductionDefectDrain(state), 6);
  assert.equal(debugDefects(state), true);
  assert.equal(state.productionDefects, 2);
  assert.equal(state.fixedDefectsPendingRelease, 2);
  assert.equal(state.productionFixesPendingRelease, 2);
  assert.equal(state.loc, 16);

  tick(state, 1);
  assert.equal(state.revenue, -6);

  assert.equal(shipRelease(state), true);
  assert.equal(state.productionDefects, 0);
  assert.equal(state.fixedDefectsPendingRelease, 0);
  assert.equal(state.productionFixesPendingRelease, 0);
}

{
  const state = createInitialState();
  state.backlogDefects = 5;

  assert.equal(debugDefects(state), true);
  assert.equal(state.backlogDefects, 3);
  assert.equal(state.productionDefects, 0);
  assert.equal(state.fixedDefectsPendingRelease, 2);
  assert.equal(state.loc, 16);
}

{
  const state = createInitialState();
  state.features = 1;
  state.backlogDefects = 10;
  state.testCoverage = 0;

  const estimate = getReleaseEstimate(state);
  assert.equal(estimate.escapedDefects, 5);

  shipRelease(state);
  assert.equal(state.backlogDefects, 5);
  assert.equal(state.productionDefects, 5);
}

{
  const state = createInitialState();
  state.customers = 42;
  state.reputation = 2;
  state.productionDefects = 3;
  state.upgrades.juniorDev = 2;
  state.upgrades.aiAssistant = 1;

  assert.equal(getRecurringRevenue(state), 4.2);
  assert.equal(getOperatingCost(state), 2.6);
  assert.equal(getProductionDefectDrain(state), 9);

  tick(state, 1);
  approx(state.revenue, -7.4);
}

{
  const state = createInitialState();
  state.upgrades.juniorDev = 2;
  tick(state, 4);

  assert.equal(state.loc, 12);
  assert.equal(state.totalLoc, 12);
}

{
  const state = createInitialState();
  state.loc = 123;
  state.revenue = 456;
  const restored = hydrateState(serializeState(state));

  assert.equal(restored.loc, 123);
  assert.equal(restored.revenue, 456);
  assert.equal(restored.upgrades.juniorDev, 0);
}

console.log('game simulation tests passed');
