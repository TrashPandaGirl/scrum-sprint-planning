const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCalc } = require('./load-calc');

const { velocityForecast } = loadCalc({ currentSprintIdx: 0, sprints: [{ start: '', end: '' }], members: [] });

test('needs at least 3 sprints and some capacity', () => {
  assert.equal(velocityForecast([20, 22], 1, 20), null);
  assert.equal(velocityForecast([20, 22, 24], 0, 20), null);
});

test('is deterministic for the same input', () => {
  const a = velocityForecast([18, 25, 31, 22, 27, 20], 0.85, 22);
  const b = velocityForecast([18, 25, 31, 22, 27, 20], 0.85, 22);
  assert.equal(a.pPlanned, b.pPlanned);
  assert.equal(a.p85, b.p85);
});

test('constant history: every level equals that velocity', () => {
  const f = velocityForecast([20, 20, 20], 1, 20);
  assert.equal(f.p50, 20);
  assert.equal(f.p85, 20);
  assert.equal(f.p95, 20);
  assert.equal(f.pPlanned, 1);
  assert.equal(velocityForecast([20, 20, 20], 1, 21).pPlanned, 0);
});

test('capacity ratio scales the outcomes', () => {
  const f = velocityForecast([20, 20, 20], 0.5, 10);
  assert.equal(f.p50, 10);
  assert.equal(f.pPlanned, 1);
});

test('probabilities follow the spread of the history', () => {
  const f = velocityForecast([10, 20, 30], 1, 30);
  assert.ok(Math.abs(f.pPlanned - 1 / 3) < 0.02, `pPlanned ${f.pPlanned}`);
  assert.equal(f.p50, 20);
  assert.equal(f.p95, 10);
  const g = velocityForecast([10, 20, 30], 1, 20);
  assert.ok(Math.abs(g.pPlanned - 2 / 3) < 0.02, `pPlanned ${g.pPlanned}`);
});

test('levels are whole SP and ordered 50 % ≥ 85 % ≥ 95 %', () => {
  const f = velocityForecast([18, 25, 31, 22, 27, 20], 0.85, 22);
  for (const v of [f.p50, f.p85, f.p95]) assert.equal(v, Math.floor(v));
  assert.ok(f.p50 >= f.p85 && f.p85 >= f.p95);
});

test('no plan: probability is null, levels still computed', () => {
  const f = velocityForecast([18, 25, 31], 1, 0);
  assert.equal(f.pPlanned, null);
  assert.equal(f.runs, 10000);
  assert.equal(f.n, 3);
});
