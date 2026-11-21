const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCalc } = require('./load-calc');

const { PALETTES, derivePalette, contrastRatio, mixHex } = loadCalc({ currentSprintIdx: 0, sprints: [{}], members: [] });
const byId = id => PALETTES.find(p => p.id === id);
const derive = p => derivePalette({ accent: p.websafe, ci: p.ci, tint: p.light });

test('12 presets, without Bestattungsmuseum, EPOSA, Service Treff and Nextbox', () => {
  assert.equal(PALETTES.length, 12);
  const names = PALETTES.map(p => p.name.toLowerCase());
  for (const banned of ['bestattungsmuseum', 'eposa', 'service treff', 'nextbox']) assert.ok(!names.includes(banned), banned);
  assert.equal(PALETTES[0].id, 'wienit');
  for (const p of PALETTES) for (const k of ['websafe', 'ci', 'light']) assert.match(p[k], /^#[0-9A-F]{6}$/i, `${p.id}.${k}`);
});

test('contrast ratio matches WCAG reference values', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
  assert.ok(Math.abs(contrastRatio('#ffffff', '#ffffff') - 1) < 0.01);
  assert.ok(Math.abs(contrastRatio('#777777', '#ffffff') - 4.48) < 0.02);
});

test('every preset: buttons ≥ 4.5:1 with white text, body text ≥ 7:1, dark accent ≥ 4.5:1', () => {
  for (const p of PALETTES) {
    const t = derive(p);
    assert.ok(contrastRatio(t.brand, '#ffffff') >= 4.5, `${p.id} brand`);
    assert.ok(contrastRatio(t.text, '#ffffff') >= 7, `${p.id} text`);
    assert.ok(contrastRatio(t.darkBrand, '#1e1e1c') >= 4.5, `${p.id} dark`);
  }
});

test('websafe colors are used unchanged as the accent (they already meet AA)', () => {
  for (const p of PALETTES) assert.equal(derive(p).brand.toLowerCase(), p.websafe.toLowerCase(), p.id);
});

test('a dark accent stays the text color; a bright one is darkened for text', () => {
  assert.equal(derive(byId('wstw')).text.toLowerCase(), '#000050');
  const linien = derive(byId('wienerlinien'));
  assert.notEqual(linien.text.toLowerCase(), '#e30014');
  assert.ok(contrastRatio(linien.text, '#ffffff') >= 7);
});

test('a light custom accent is darkened until white button text is readable', () => {
  const t = derivePalette({ accent: '#7fd3ff', ci: '#7fd3ff', tint: '#ffffff' });
  assert.ok(contrastRatio('#7fd3ff', '#ffffff') < 4.5);
  assert.ok(contrastRatio(t.brand, '#ffffff') >= 4.5);
});

test('tokens: page tint, borders from the text color, light and dark sets', () => {
  const t = derive(byId('wienenergie'));
  assert.equal(t.light['--page'], mixHex('#FEF8F6', '#eceff1', 0.5));
  assert.match(t.light['--border'], /^rgba\(\d+,\d+,\d+,0\.16\)$/);
  for (const k of ['--brand', '--on-brand', '--text', '--text2', '--text3', '--bg2', '--bg3', '--surface']) assert.ok(t.light[k], k);
  for (const k of ['--brand', '--on-brand', '--accent-label']) assert.ok(t.dark[k], k);
});
