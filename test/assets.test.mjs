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

test('icons and the share image exist at the right sizes', () => {
  assert.deepEqual(pngSize(join(pub, 'img/og.png')), [1200, 630]);
  assert.deepEqual(pngSize(join(pub, 'img/apple-touch-icon.png')), [180, 180]);
  assert.deepEqual(pngSize(join(pub, 'img/favicon.png')), [48, 48]);
});

test('hidden attribute wins over component display rules (Start button hides after boot)', () => {
  const css = readFileSync(join(pub, 'css/site.css'), 'utf8');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('stylesheet defines the app palette', () => {
  const css = readFileSync(join(pub, 'css/site.css'), 'utf8');
  for (const c of ['#050608', '#0F1115', '#2A2D33', '#FF3B30', '#E6E8EC']) assert.ok(css.includes(c), c);
});
