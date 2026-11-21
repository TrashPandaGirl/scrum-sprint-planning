const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCalc } = require('./load-calc');

const PLAIN = { start: '2025-03-03', end: '2025-03-16' };   // 10 workdays, no holidays
const EASTER = { start: '2025-04-14', end: '2025-04-27' };  // Karfreitag + Ostermontag on weekdays

const member = (o = {}) => ({ id: 1, focus: 70, workDays: [1, 2, 3, 4, 5], weeklyHours: 40, meetingHours: null, ...o });
const setup = ({ sprint = PLAIN, dayStates = {}, members = [member()] } = {}) =>
  loadCalc({ currentSprintIdx: 0, sprints: [{ ...sprint, unit: 'days', meetingHours: 12, dayStates }], members });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('full sprint: ratio 1, range is 90–100 % of average velocity', () => {
  const r = setup().commitmentRecommendation(30);
  near(r.ratio, 1);
  assert.equal(r.high, 30);
  assert.equal(r.low, 27);
  assert.equal(r.holidays, 0);
  assert.equal(r.absenceDays, 0);
});

test('holidays shrink the ratio and are counted only on weekdays', () => {
  const r = setup({ sprint: EASTER }).commitmentRecommendation(30);
  near(r.ratio, 0.8);           // 8 of 10 workdays
  assert.equal(r.high, 24);
  assert.equal(r.low, 22);      // 21.6 rounds to 22
  assert.equal(r.holidays, 2);  // Ostersonntag (Sunday) not counted
});

test('absences shrink the ratio; half days count 0.5', () => {
  const r = setup({ dayStates: { '2025-03-03:1': 'absent', '2025-03-04:1': 'half' } }).commitmentRecommendation(20);
  near(r.ratio, 8.5 / 10);
  assert.equal(r.absenceDays, 1.5);
  assert.equal(r.high, 17);
});

test('ratio is hour-weighted across members', () => {
  const members = [member({ id: 1 }), member({ id: 2, weeklyHours: 20 })];
  // member 1 absent the whole first week: 40h of 80h; member 2 full: 40h of 40h
  const dayStates = {};
  for (let d = 3; d <= 7; d++) dayStates[`2025-03-0${d}:1`] = 'absent';
  const r = setup({ members, dayStates }).commitmentRecommendation(30);
  near(r.ratio, 80 / 120);
  assert.equal(r.absenceDays, 5);
  assert.equal(r.high, 20);
});

test('part-timer: baseline uses only their own workdays', () => {
  const { memberBaselineHours, memberAvailableHours } = setup({ sprint: EASTER });
  const m = member({ weeklyHours: 24, workDays: [1, 2, 3] });
  near(memberBaselineHours(m), 6 * 8);   // Mo–Mi over two weeks
  near(memberAvailableHours(m), 5 * 8);  // Ostermontag removed, Karfreitag irrelevant
});

test('absence on a holiday or weekend is not counted twice', () => {
  const r = setup({ sprint: EASTER, dayStates: { '2025-04-18:1': 'absent', '2025-04-19:1': 'absent' } }).commitmentRecommendation(30);
  assert.equal(r.absenceDays, 0);
  near(r.ratio, 0.8);
});

test('no members or no workdays: ratio 0, range 0', () => {
  assert.equal(setup({ members: [] }).commitmentRecommendation(30).ratio, 0);
  const r = setup({ sprint: { start: '2025-12-27', end: '2025-12-28' } }).commitmentRecommendation(30);
  assert.equal(r.ratio, 0);
  assert.equal(r.high, 0);
});

test('zero velocity gives a zero range', () => {
  const r = setup().commitmentRecommendation(0);
  assert.equal(r.low, 0);
  assert.equal(r.high, 0);
});
