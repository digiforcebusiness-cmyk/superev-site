import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = join(root, 'public');
let html = [];

/** Width/height from a PNG header. */
const pngSize = (p) => { const b = readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

before(() => {
  execFileSync(process.execPath, ['build.mjs'], { cwd: root });
  const cars = JSON.parse(readFileSync(join(root, 'data/cars.json')));
  html = ['index.html', 'cars/index.html', '404.html', `cars/${cars[0].slug}/index.html`]
    .map((p) => readFileSync(join(pub, p), 'utf8'));
});

test('every <img> has alt, width and height, and its file exists', () => {
  for (const h of html) {
    for (const [tag] of h.matchAll(/<img [^>]*>/g)) {
      assert.match(tag, / alt="[^"]+"/, tag);
      assert.match(tag, / width="\d+"/, tag);
      assert.match(tag, / height="\d+"/, tag);
      const src = tag.match(/ src="([^"]+)"/)[1];
      assert.ok(existsSync(join(pub, src)), `missing ${src}`);
    }
  }
});

test('app section shows all 4 phone screenshots in order', () => {
  const shots = [...html[0].matchAll(/src="\/img\/(screen-\d)\.webp"/g)].map((m) => m[1]);
  assert.deepEqual(shots, ['screen-1', 'screen-2', 'screen-3', 'screen-4']);
});

test('icons and the share image exist at the right sizes', () => {
  assert.deepEqual(pngSize(join(pub, 'img/og.png')), [1200, 630]);
  assert.deepEqual(pngSize(join(pub, 'img/apple-touch-icon.png')), [180, 180]);
  assert.deepEqual(pngSize(join(pub, 'img/favicon.png')), [48, 48]);
});

test('hidden attribute wins over component display rules (Start button hides after boot)', () => {
  const css = readFileSync(join(pub, 'css/site.css'), 'utf8');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('red buttons meet WCAG AA contrast (4.5:1) for their text', () => {
  const css = readFileSync(join(pub, 'css/site.css'), 'utf8');
  const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
  const rule = css.match(/\.btn-red \{([^}]*)\}/)[1];
  const val = (prop) => { const v = rule.match(new RegExp(`${prop}:\\s*([^;]+)`))[1].trim(); return v.startsWith('var') ? vars[v.slice(6, -1)] : v; };
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const [a, b] = [lum(val('background')), lum(val('color') === '#fff' ? '#ffffff' : val('color'))].sort((x, y) => y - x);
  assert.ok((a + .05) / (b + .05) >= 4.5, `ratio ${((a + .05) / (b + .05)).toFixed(2)}`);
});

test('no Vercel insights script until Web Analytics is enabled (it 404s)', () => {
  for (const h of html) assert.ok(!h.includes('/_vercel/insights/'));
});

test('stylesheet defines the app palette', () => {
  const css = readFileSync(join(pub, 'css/site.css'), 'utf8');
  for (const c of ['#050608', '#0F1115', '#2A2D33', '#FF3B30', '#E6E8EC']) assert.ok(css.includes(c), c);
});
