const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCalc } = require('./load-calc');

const setup = (sprint = { start: '2026-12-14', end: '2026-12-27' }) =>
  loadCalc({ currentSprintIdx: 0, sprints: [{ ...sprint, dayStates: {} }], members: [] });
const { backlogForecast } = setup();
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('needs 3 sprints of history and a positive backlog', () => {
  assert.equal(backlogForecast([20, 20], 100), null);
  assert.equal(backlogForecast([20, 20, 20], 0), null);
});

test('constant velocity: exact number of sprints, ceil(backlog / velocity)', () => {
  const f = backlogForecast([20, 20, 20], 100);
  assert.equal(f.p50, 5);
  assert.equal(f.p95, 5);
  assert.equal(f.probWithin(4), 0);
  assert.equal(f.probWithin(5), 1);
  assert.equal(backlogForecast([20, 20, 20], 101).p50, 6);
});

test('first sprint uses the current capacity ratio, later ones full', () => {
  // 20 × 0.5 = 10 in sprint 1, then 20 each: 90 SP → 10 + 20·4 = 90 → 5 sprints
  assert.equal(backlogForecast([20, 20, 20], 90, 0.5).p50, 5);
  assert.equal(backlogForecast([20, 20, 20], 91, 0.5).p50, 6);
});

test('levels are ordered and the probability curve rises', () => {
  const f = backlogForecast([12, 25, 31, 18, 27, 22], 150, 0.85);
  assert.ok(f.p50 <= f.p85 && f.p85 <= f.p95);
  let prev = 0;
  for (let k = 1; k <= 20; k++) { const p = f.probWithin(k); assert.ok(p >= prev); prev = p; }
  assert.ok(f.probWithin(f.p85) >= 0.85);
  assert.ok(f.probWithin(f.p85 - 1) < 0.85);
});

test('is deterministic for the same input', () => {
  const a = backlogForecast([12, 25, 31, 18, 27, 22], 150, 0.85);
  const b = backlogForecast([12, 25, 31, 18, 27, 22], 150, 0.85);
  assert.equal(a.p85, b.p85);
  assert.equal(a.probWithin(7), b.probWithin(7));
});

test('a backlog too big for 52 sprints is reported as Infinity', () => {
  const f = backlogForecast([1, 1, 1], 1000);
  assert.equal(f.p50, Infinity);
  assert.equal(f.probWithin(52), 0);
});

test('sprint end dates follow newSprint(): start on the previous end, same length', () => {
  const { forecastSprintEnd } = setup();          // 14.12.–27.12. → length 13 days
  assert.equal(iso(forecastSprintEnd(1)), '2026-12-27');
  assert.equal(iso(forecastSprintEnd(2)), '2027-01-09');
  assert.equal(iso(forecastSprintEnd(3)), '2027-01-22');
  assert.equal(setup({ start: '', end: '' }).forecastSprintEnd(2), null);
});
