const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCalc } = require('./load-calc');

const { getAustrianHolidays, HOLIDAYS, isHoliday, isWorkday } = loadCalc({ sprints: [], members: [] });

const FIXED = ['01-01', '01-06', '05-01', '08-15', '10-26', '11-01', '12-08', '12-25', '12-26'];

// Easter Sunday → [Karfreitag, Ostermontag, Christi Himmelfahrt, Pfingstmontag, Fronleichnam]
const MOVABLE = {
  2024: { easter: '03-31', karfreitag: '03-29', ostermontag: '04-01', himmelfahrt: '05-09', pfingstmontag: '05-20', fronleichnam: '05-30' },
  2025: { easter: '04-20', karfreitag: '04-18', ostermontag: '04-21', himmelfahrt: '05-29', pfingstmontag: '06-09', fronleichnam: '06-19' },
  2026: { easter: '04-05', karfreitag: '04-03', ostermontag: '04-06', himmelfahrt: '05-14', pfingstmontag: '05-25', fronleichnam: '06-04' },
};

test('contains the nine fixed holidays with German names', () => {
  const h = getAustrianHolidays(2025);
  for (const d of FIXED) assert.ok(h[`2025-${d}`], `missing ${d}`);
  assert.equal(h['2025-01-01'], 'Neujahr');
  assert.equal(h['2025-10-26'], 'Nationalfeiertag');
  assert.equal(h['2025-12-26'], 'Stefanitag');
});

test('has 16 holidays per year (9 fixed + 7 Easter-based)', () => {
  assert.equal(Object.keys(getAustrianHolidays(2025)).length, 16);
});

for (const [year, d] of Object.entries(MOVABLE)) {
  test(`Easter-based holidays ${year}`, () => {
    const h = getAustrianHolidays(Number(year));
    assert.equal(h[`${year}-${d.easter}`], 'Ostersonntag');
    assert.equal(h[`${year}-${d.karfreitag}`], 'Karfreitag');
    assert.equal(h[`${year}-${d.ostermontag}`], 'Ostermontag');
    assert.equal(h[`${year}-${d.himmelfahrt}`], 'Christi Himmelfahrt');
    assert.equal(h[`${year}-${d.pfingstmontag}`], 'Pfingstmontag');
    assert.equal(h[`${year}-${d.fronleichnam}`], 'Fronleichnam');
  });
}

test('Pfingstsonntag is 49 days after Easter', () => {
  assert.equal(getAustrianHolidays(2025)['2025-06-08'], 'Pfingstsonntag');
});

test('all keys are ISO dates inside the requested year', () => {
  for (const k of Object.keys(getAustrianHolidays(2027))) assert.match(k, /^2027-\d{2}-\d{2}$/);
});

test('HOLIDAYS lookup covers 2024–2034 only', () => {
  assert.ok(HOLIDAYS['2024-01-01']);
  assert.ok(HOLIDAYS['2034-12-26']);
  assert.ok(!HOLIDAYS['2023-01-01']);
  assert.ok(!HOLIDAYS['2035-01-01']);
});

test('isHoliday / isWorkday', () => {
  assert.equal(isHoliday('2025-04-21'), true);
  assert.equal(isHoliday('2025-04-22'), false);
  assert.equal(isWorkday(new Date(2025, 3, 21)), false); // Ostermontag
  assert.equal(isWorkday(new Date(2025, 3, 22)), true); // Tuesday
  assert.equal(isWorkday(new Date(2025, 3, 26)), false); // Saturday
});
