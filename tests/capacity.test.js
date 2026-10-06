const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCalc } = require('./load-calc');

// Sprint 2025-03-03 (Mo) … 2025-03-16 (So): 10 workdays, no holidays.
const PLAIN = { start: '2025-03-03', end: '2025-03-16' };
// Sprint 2025-04-14 … 2025-04-27: Karfreitag (18th) + Ostermontag (21st) → 8 workdays.
const EASTER = { start: '2025-04-14', end: '2025-04-27' };

const member = (o = {}) => ({ id: 1, name: 'T', role: 'Developer', focus: 100, workDays: [1, 2, 3, 4, 5], weeklyHours: 40, meetingHours: null, ...o });
const setup = ({ sprint = PLAIN, unit = 'hours', meetingHours = 0, dayStates = {}, members = [member()] } = {}) => {
  const state = { currentSprintIdx: 0, sprints: [{ ...sprint, unit, meetingHours, dayStates }], members };
  return { state, ...loadCalc(state) };
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('sprint days are inclusive; workdays skip weekends', () => {
  const { getSprintDays, getSprintWorkdays } = setup();
  assert.equal(getSprintDays().length, 14);
  assert.equal(getSprintWorkdays().length, 10);
});

test('workdays skip public holidays', () => {
  assert.equal(setup({ sprint: EASTER }).getSprintWorkdays().length, 8);
});

test('empty start/end gives no days', () => {
  assert.equal(setup({ sprint: { start: '', end: '' } }).getSprintDays().length, 0);
});

test('daily rate = weekly hours / workdays; falls back to 5 days', () => {
  const { memberDailyRate } = setup();
  assert.equal(memberDailyRate(member({ weeklyHours: 40 })), 8);
  assert.equal(memberDailyRate(member({ weeklyHours: 24, workDays: [1, 2, 3] })), 8);
  assert.equal(memberDailyRate(member({ weeklyHours: 20, workDays: [] })), 4);
});

test('full availability, no meetings, 100% focus → 80 h', () => {
  const { memberSprintCapacity } = setup();
  near(memberSprintCapacity(member()), 80);
});

test('unit "days" divides by the daily rate', () => {
  const { memberSprintCapacity } = setup({ unit: 'days' });
  near(memberSprintCapacity(member()), 10);
});

test('meeting hours are deducted before focus is applied', () => {
  const { memberSprintCapacity } = setup({ meetingHours: 12 });
  near(memberSprintCapacity(member({ focus: 50 })), (80 - 12) * 0.5);
});

test('per-member meeting hours override the sprint default (also 0)', () => {
  const { memberSprintCapacity, memberMeetingHours } = setup({ meetingHours: 12 });
  near(memberSprintCapacity(member({ meetingHours: 4 })), 76);
  near(memberSprintCapacity(member({ meetingHours: 0 })), 80);
  assert.equal(memberMeetingHours(member({ meetingHours: '' })), 12);
  assert.equal(memberMeetingHours(member({ meetingHours: undefined })), 12);
});

test('meetings larger than available hours never go negative', () => {
  const { memberSprintCapacity } = setup({ meetingHours: 500 });
  assert.equal(memberSprintCapacity(member()), 0);
});

test('public holidays reduce capacity', () => {
  const { memberSprintCapacity } = setup({ sprint: EASTER });
  near(memberSprintCapacity(member()), 64);
});

test('holiday on a non-working day of a part-timer costs nothing', () => {
  // Mo–Mi worker: Karfreitag (Fr) irrelevant, Ostermontag (Mo) removed → 5 days × 8 h.
  const { memberSprintCapacity } = setup({ sprint: EASTER });
  near(memberSprintCapacity(member({ weeklyHours: 24, workDays: [1, 2, 3] })), 40);
});

test('part-time workdays: 3 days/week × 2 weeks × 8 h = 48 h', () => {
  const { memberSprintCapacity } = setup();
  near(memberSprintCapacity(member({ weeklyHours: 24, workDays: [1, 2, 3] })), 48);
});

test('absent day removes a full daily rate; half day removes half', () => {
  const { memberSprintCapacity } = setup({ dayStates: { '2025-03-03:1': 'absent', '2025-03-04:1': 'half' } });
  near(memberSprintCapacity(member()), 80 - 8 - 4);
});

test('meeting hours shrink proportionally with absence', () => {
  const { memberSprintCapacity } = setup({ meetingHours: 12, dayStates: { '2025-03-03:1': 'absent' } });
  // brutto 72, attendance 0.9, meetings 10.8
  near(memberSprintCapacity(member()), 72 - 12 * 0.9);
});

test('absence on a weekend or holiday has no effect', () => {
  const { memberSprintCapacity } = setup({ sprint: EASTER, dayStates: { '2025-04-18:1': 'absent', '2025-04-19:1': 'absent' } });
  near(memberSprintCapacity(member()), 64);
});

test('absence is per member', () => {
  const { memberSprintCapacity } = setup({ dayStates: { '2025-03-03:2': 'absent' } });
  near(memberSprintCapacity(member({ id: 1 })), 80);
  near(memberSprintCapacity(member({ id: 2 })), 72);
});

test('fully absent → 0 and no division by zero', () => {
  const dayStates = {};
  for (let d = 3; d <= 14; d++) dayStates[`2025-03-${String(d).padStart(2, '0')}:1`] = 'absent';
  const { memberSprintCapacity } = setup({ meetingHours: 12, dayStates });
  assert.equal(memberSprintCapacity(member()), 0);
});

test('no workdays in sprint (all holidays/weekend) → 0', () => {
  const { memberSprintCapacity } = setup({ sprint: { start: '2025-12-25', end: '2025-12-28' }, meetingHours: 12 });
  assert.equal(memberSprintCapacity(member()), 0);
});

test('zero weekly hours in days unit → 0', () => {
  const { memberSprintCapacity } = setup({ unit: 'days' });
  assert.equal(memberSprintCapacity(member({ weeklyHours: 0 })), 0);
});

test('theoretical max ignores absences but applies meetings and focus', () => {
  const { memberTheoreticalMax, memberTheoreticalMaxHours } = setup({ meetingHours: 12, dayStates: { '2025-03-03:1': 'absent' } });
  near(memberTheoreticalMaxHours(member()), 80);
  near(memberTheoreticalMax(member({ focus: 50 })), 34);
});

test('theoretical max in days unit', () => {
  const { memberTheoreticalMax } = setup({ unit: 'days', meetingHours: 8 });
  near(memberTheoreticalMax(member()), 9);
});

test('team capacity sums all members', () => {
  const members = [member({ id: 1 }), member({ id: 2, focus: 50 }), member({ id: 3, weeklyHours: 20 })];
  const { teamTotalCapacity } = setup({ members });
  near(teamTotalCapacity(), 80 + 40 + 40);
  assert.equal(setup({ members: [] }).teamTotalCapacity(), 0);
});

test('memberSprintCapacity creates missing dayStates on the sprint', () => {
  const { state, memberSprintCapacity } = setup();
  delete state.sprints[0].dayStates;
  near(memberSprintCapacity(member()), 80);
  assert.equal(JSON.stringify(state.sprints[0].dayStates), '{}');
});
