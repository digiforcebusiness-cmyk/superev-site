import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = join(root, 'public');
const cars = JSON.parse(readFileSync(join(root, 'data/cars.json')));
const categories = JSON.parse(readFileSync(join(root, 'data/categories.json')));
const IOS = 'https://apps.apple.com/app/id6770043689?ct=superev';
const PLAY = 'https://play.google.com/store/apps/details?id=com.tuning3d.engine.sounds&amp;referrer=utm_source%3Dsuperev';
const DISCLAIMER = 'Engine-inspired simulations. Not affiliated with or endorsed by any vehicle manufacturer.';
let pages = {};

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  if (f === 'packs') return [];
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const one = (html, re) => { const m = all(html, re); assert.equal(m.length, 1, `${re}: ${m.length}`); return m[0]; };

before(() => {
  execFileSync(process.execPath, ['build.mjs'], { cwd: root });
  for (const p of walk(pub)) pages[relative(pub, p).replaceAll('\\', '/')] = readFileSync(p, 'utf8');
});

test('writes home, cars index, category hubs, car pages, privacy, contact and 404', () => {
  assert.equal(Object.keys(pages).length, 5 + categories.length + cars.length);
  assert.ok(pages['index.html'] && pages['cars/index.html'] && pages['404.html']);
  for (const c of cars) assert.ok(pages[`cars/${c.slug}/index.html`], c.slug);
  for (const c of categories) assert.ok(pages[`cars/${c.slug}/index.html`], c.slug);
});

test('titles are unique and at most 70 characters', () => {
  const titles = Object.values(pages).map((h) => one(h, /<title>([^<]*)<\/title>/g));
  assert.equal(new Set(titles).size, titles.length);
  for (const t of titles) assert.ok(t.length <= 70, `${t.length}: ${t}`);
});

test('every indexable page has one canonical, one h1, a short description and valid JSON-LD', () => {
  for (const [path, h] of Object.entries(pages)) {
    if (path === '404.html') continue;
    const canon = one(h, /<link rel="canonical" href="([^"]+)"/g);
    assert.match(canon, /^https:\/\/superev\.app\/(.*\/)?$/, path);
    one(h, /<h1[^>]*>([\s\S]*?)<\/h1>/g);
    const desc = one(h, /<meta name="description" content="([^"]*)"/g);
    assert.ok(desc.length >= 50 && desc.length <= 160, `${path} desc ${desc.length}`);
    for (const ld of all(h, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(ld);
    assert.ok(h.includes('application/ld+json'), path);
    assert.ok(h.includes('<meta name="apple-itunes-app" content="app-id=6770043689">'), path);
    assert.ok(h.includes('href="/css/site.css"'), path);
  }
});

test('car pages work without JavaScript: name, engine, stores, disclaimer, similar engines', () => {
  for (const c of cars) {
    const h = pages[`cars/${c.slug}/index.html`];
    assert.ok(h.includes(c.name), c.slug);
    if (c.engine) assert.ok(h.includes(c.engine), c.slug);
    assert.ok(h.includes(IOS) && h.includes(PLAY), `${c.slug} store links`);
    assert.ok(h.includes(DISCLAIMER), `${c.slug} disclaimer`);
    const similar = h.slice(h.indexOf('data-similar'));
    assert.ok(all(similar, /href="\/cars\/([a-z0-9-]+)\/"/g).length >= 3, `${c.slug} similar`);
    assert.ok(h.includes('"@type":"FAQPage"') && h.includes('"@type":"BreadcrumbList"'), c.slug);
    assert.ok(h.includes(`data-car='`) && h.includes(`"id":"${c.id}"`), `${c.slug} demo`);
  }
});

test('home page carries the app schema and every car in the picker', () => {
  const h = pages['index.html'];
  assert.ok(h.includes('"@type":"MobileApplication"'));
  assert.equal(all(h, /<option value="([a-z0-9-]+)"/g).length, cars.length);
});

test('sitemap lists every page except 404; robots points to it', () => {
  const sm = readFileSync(join(pub, 'sitemap.xml'), 'utf8');
  const locs = all(sm, /<loc>([^<]+)<\/loc>/g);
  assert.equal(locs.length, 4 + categories.length + cars.length);
  assert.ok(locs.every((l) => l.startsWith('https://superev.app/') && l.endsWith('/')));
  assert.ok(readFileSync(join(pub, 'robots.txt'), 'utf8').includes('Sitemap: https://superev.app/sitemap.xml'));
});

test('privacy policy lives on superev.app, covers app ads (AdMob + Unity) and the website, and every footer links to it', () => {
  const h = pages['privacy/index.html'];
  assert.ok(h, 'privacy page missing');
  assert.equal(one(h, /<link rel="canonical" href="([^"]+)"/g), 'https://superev.app/privacy/');
  assert.match(one(h, /<h1[^>]*>([\s\S]*?)<\/h1>/g), /Privacy Policy/);
  for (const s of ['Google AdMob', 'Unity Ads', 'Location', 'superev.app', 'cookies', 'Children']) assert.ok(h.includes(s), s);
  for (const [path, p] of Object.entries(pages)) assert.ok(p.includes('href="/privacy/"'), path);
});

test('contact page: form with required fields posting via Web3Forms, mailto fallback, help topics; every footer links to it', () => {
  const h = pages['contact/index.html'];
  assert.ok(h, 'contact page missing');
  assert.equal(one(h, /<link rel="canonical" href="([^"]+)"/g), 'https://superev.app/contact/');
  for (const n of ['name', 'email', 'subject', 'message']) assert.match(h, new RegExp(`name="${n}"[^>]*required`), n);
  assert.ok(h.includes('<script type="module" src="/js/contact.js"></script>'));
  assert.ok(readFileSync(join(pub, 'js/contact.js'), 'utf8').includes('https://api.web3forms.com/submit'));
  assert.ok(h.includes('mailto:digiforcebusiness@gmail.com'));
  for (const s of ['Bug reports', 'Quick troubleshooting', 'Bluetooth']) assert.ok(h.includes(s), s);
  for (const [path, p] of Object.entries(pages)) assert.ok(p.includes('href="/contact/"'), path);
  assert.ok(pages['privacy/index.html'].includes('Web3Forms'), 'privacy must disclose the contact form processor');
});
