// Extracts the app's engine catalog into data/cars.json.
// Usage: node scripts/extract-cars.mjs <path-to-SuperRev-app-repo>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const app = process.argv[2];
if (!app) throw new Error('usage: extract-cars.mjs <app repo path>');
const catalog = readFileSync(join(app, 'lib/cars/car_catalog.dart'), 'utf8');
const named = readFileSync(join(app, 'lib/cars/named_car_catalog.dart'), 'utf8');

export const slugify = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SIGNATURE = 'Signature Sounds';
const custom = {};
for (const m of catalog.matchAll(/CarProfile _\w+\(\) => CarProfile\(\s*id: '(\w+)',\s*displayName: '([^']+)',\s*idleRpm: (\d+),\s*redline: (\d+)/g))
  custom[m[1]] = { id: m[1], name: m[2], engine: null, category: SIGNATURE, idle: +m[3], redline: +m[4] };

const cars = [];
// Carousel order = the order of _buildCatalog's list.
const list = catalog.slice(catalog.indexOf('return ['), catalog.indexOf('];', catalog.indexOf('return [')));
for (const line of list.split('\n')) {
  const c = line.match(/_(rotaryX8|i6German)\(\)/);
  if (c) cars.push(custom[c[1] === 'rotaryX8' ? 'rotary_x8' : 'i6_german']);
  const p = line.match(/_performance\('(\w+)', '([^']+)', (\d+), (\d+)/);
  if (p) cars.push({ id: p[1], name: p[2], engine: null, category: SIGNATURE, idle: +p[3], redline: +p[4] });
  if (line.includes('namedEngines'))
    for (const n of named.matchAll(/NamedEngine\(\s*"(\w+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(\d+),\s*(\d+),?\s*\)/g))
      cars.push({ id: n[1], name: n[2], engine: n[3], category: n[4], idle: +n[5], redline: +n[6] });
}
for (const c of cars) c.slug = slugify(c.name);
writeFileSync(new URL('../data/cars.json', import.meta.url), JSON.stringify(cars, null, 1) + '\n');
console.log(`${cars.length} cars, categories:`, [...new Set(cars.map((c) => c.category))]);
