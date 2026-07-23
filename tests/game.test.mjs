import assert from 'node:assert/strict';
import {
  createInitialState,
  writeCode,
  buyUpgrade,
  createFeature,
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
  assert.equal(state.defects, 1);
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
  state.loc = 250;
  state.testCoverage = 10;
  createFeature(state);

  assert.equal(state.loc, 50);
  assert.equal(state.features, 1);
  assert.equal(state.technicalDebt, 3);
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
  state.features = 2;
  state.defects = 3;
  state.technicalDebt = 10;
  state.testCoverage = 20;
  shipRelease(state);

  assert.equal(state.features, 0);
  approx(state.revenue, 372);
  approx(state.reputation, 2.2);
  assert.equal(state.customers, 18);
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
