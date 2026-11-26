import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const cars = JSON.parse(readFileSync(new URL('../data/cars.json', import.meta.url)));
const categories = JSON.parse(readFileSync(new URL('../data/categories.json', import.meta.url)));
const PACK_FILES = ['idle', 'low_on', 'low_off', 'med_on', 'med_off', 'high_on', 'high_off', 'maxRPM', 'startup'];

test('catalog has all 132 app engines in carousel order', () => {
  assert.equal(cars.length, 132);
  assert.equal(cars[0].id, 'rotary_x8');
});

test('slugs are unique and url-safe', () => {
  const slugs = cars.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});

test('every car belongs to a known category and idle < redline', () => {
  const names = new Set(categories.map((c) => c.name));
  for (const c of cars) {
    assert.ok(names.has(c.category), `${c.id} category ${c.category}`);
    assert.ok(c.idle < c.redline, c.id);
  }
});

test('named car specs come from the app catalog', () => {
  const f = cars.find((c) => c.id === 'ferrari_458_italia');
  assert.equal(f.engine, '4.5L Naturally Aspirated V8');
  assert.equal(f.idle, 900);
  assert.equal(f.redline, 9000);
});

test('categories have a slug and an intro', () => {
  for (const c of categories) {
    assert.match(c.slug, /^[a-z0-9-]+$/);
    assert.ok(c.intro.length > 80, c.name);
  }
  assert.ok(categories.some((c) => c.name === 'Signature Sounds'));
});

test('every car has its 9 pack files', () => {
  for (const c of cars)
    for (const f of PACK_FILES)
      assert.ok(existsSync(new URL(`../public/packs/${c.id}/${f}.ogg`, import.meta.url)), `${c.id}/${f}`);
});
