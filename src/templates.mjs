import {
  esc, fit, metaTags, jsonLd, appSchema, websiteSchema, breadcrumbSchema, faqSchema,
  IOS_URL, PLAY_URL, PRIVACY_URL, SUPPORT_URL, DISCLAIMER,
} from './seo.mjs';
import { carParagraphs, carFaq, carDescription, HOME_FAQ } from './copy.mjs';

const fmt = (n) => n.toLocaleString('en-US');
const demoCar = (c) => JSON.stringify({ id: c.id, name: c.name, idle: c.idle, redline: c.redline, category: c.category }).replaceAll("'", '&#39;');

export function storeBadges(cls = '') {
  return `<div class="badges ${cls}">
<a class="badge" href="${esc(IOS_URL)}" rel="noopener"><img src="/img/app-store-badge.svg" alt="Download on the App Store" width="120" height="40"></a>
<a class="badge" href="${esc(PLAY_URL)}" rel="noopener"><img src="/img/google-play-badge.png" alt="Get it on Google Play" width="134" height="40"></a>
</div>`;
}

export function page({ title, description, path, body, schemas = [], demo = false, extraHead = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${metaTags({ title, description, path })}
<meta name="theme-color" content="#050608">
<meta name="apple-itunes-app" content="app-id=6770043689">
<link rel="icon" href="/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="stylesheet" href="/css/site.css">
${extraHead}${schemas.map(jsonLd).join('\n')}
</head>
<body>
<header class="site-header">
<a class="logo" href="/" aria-label="SuperRev home">SUPER<span>REV</span></a>
<nav><a href="/cars/">Engines</a><a class="btn btn-small btn-red" href="/#get-the-app">Get the app</a></nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">
${storeBadges()}
<p><a href="/cars/">All engines</a> · <a href="${PRIVACY_URL}" rel="noopener">Privacy</a> · <a href="${SUPPORT_URL}" rel="noopener">Support</a></p>
<p class="muted">${DISCLAIMER}</p>
<p class="muted">© ${new Date().getFullYear()} SuperRev</p>
</footer>
${demo ? '<script type="module" src="/js/demo.js"></script>' : ''}
</body>
</html>
`;
}

export function demoBlock(car, { cars = null, categories = null } = {}) {
  const picker = cars ? `<label class="picker"><span>Engine</span><select data-picker>
${categories.map((cat) => `<optgroup label="${esc(cat.name)}">${cars.filter((c) => c.category === cat.name)
    .map((c) => `<option value="${c.slug}" data-car='${demoCar(c)}'${c.id === car.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`).join('\n')}
</select></label>
<a class="car-link" data-car-link href="/cars/${car.slug}/">More about the ${esc(car.name)} →</a>` : '';
  return `<section class="demo" data-demo data-car='${demoCar(car)}' aria-label="Engine sound demo">
<div class="dash">
<canvas class="tach" width="300" height="300" role="img" aria-label="Tachometer"></canvas>
<div class="readouts"><div><span data-rpm>${fmt(car.idle)}</span><small>RPM</small></div><div><span data-gear>1</span><small>GEAR</small></div></div>
</div>
${picker}
<div class="views" role="group" aria-label="Listening position">
<button type="button" data-view="exhaust" aria-pressed="true">01 EXHAUST</button><button type="button" data-view="intake" aria-pressed="false">02 INTAKE</button><button type="button" data-view="side" aria-pressed="false">03 SIDE</button><button type="button" data-view="cabin" aria-pressed="false">04 CABIN</button>
</div>
<button type="button" class="pedal" data-pedal hidden>Hold to rev</button>
<button type="button" class="btn btn-red btn-start" data-start>Start engine</button>
<p class="status" data-status role="status" aria-live="polite">Press Start, then hold the pedal or the Space bar to rev.</p>
<div class="limit-card" data-limit hidden>
<h3>Keep revving, in the app</h3>
<p>In SuperRev, this engine follows your real driving with <strong>GPS mode</strong> and your phone's motion with <strong>acceleration sync</strong>.</p>
${storeBadges()}
<button type="button" class="btn btn-ghost" data-dismiss>Keep revving here</button>
</div>
</section>`;
}

function faqBlock(faq) {
  return `<section class="faq"><h2>Questions</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}</section>`;
}

function appSection(count) {
  return `<section class="app-pitch" id="get-the-app">
<h2>Only in the app</h2>
<div class="features">
<article><h3>GPS mode</h3><p>Drive, and the engine follows your real speed: RPM climbs, gears shift, the exhaust crackles on lift-off.</p></article>
<article><h3>Acceleration sync</h3><p>Your phone's motion sensors drive the throttle, so every push and brake changes the engine note instantly.</p></article>
<article><h3>${count} engines</h3><p>From cross-plane V8 muscle to V12 hypercars and JDM legends, with four listening positions.</p></article>
<article><h3>Works offline</h3><p>No account and no connection needed. Open it, pick an engine, drive.</p></article>
</div>
<div class="shots">
<img src="/img/screen-1.webp" alt="Place your phone in the car: SuperRev plays through your car stereo over Bluetooth" width="300" height="649" loading="lazy">
<img src="/img/screen-2.webp" alt="Sounds that follow you: the engine responds as you accelerate, in real time" width="300" height="649" loading="lazy">
<img src="/img/screen-3.webp" alt="Choose your favorite engine, from legendary V8s to exotic supercars" width="300" height="649" loading="lazy">
<img src="/img/screen-4.webp" alt="Made for car enthusiasts: SuperRev tachometer on the dashboard" width="300" height="649" loading="lazy">
</div>
${storeBadges('badges-large')}
</section>`;
}

const carCard = (c) => `<li><a href="/cars/${c.slug}/"><strong>${esc(c.name)}</strong><span>${esc(c.engine ?? 'SuperRev signature engine')} · ${fmt(c.redline)} rpm</span></a></li>`;

export function home({ cars, categories }) {
  const featured = cars.find((c) => c.id === 'ferrari_458_italia') ?? cars[0];
  const body = `<section class="hero">
<h1>Rev any engine. <span>Then take it for a drive.</span></h1>
<p class="lead">${cars.length} real engine sounds, from V8 muscle to V12 hypercars. Rev them right here, then let the SuperRev app turn your phone into your car's soundtrack with GPS mode and acceleration sync.</p>
</section>
${demoBlock(featured, { cars, categories })}
${appSection(cars.length)}
<section class="categories"><h2>Browse engines</h2><ul class="cat-grid">
${categories.map((cat) => `<li><a href="/cars/${cat.slug}/"><strong>${esc(cat.name)}</strong><span>${cars.filter((c) => c.category === cat.name).length} engines</span></a></li>`).join('\n')}
</ul></section>
${faqBlock(HOME_FAQ)}`;
  return page({
    title: 'SuperRev — Rev Real Engine Sounds Online & In Your Car',
    description: `Rev ${cars.length} real engine sounds free in your browser, from V8 muscle to V12 hypercars. Get SuperRev for GPS mode and acceleration sync while you drive.`,
    path: '/', body, demo: true,
    schemas: [appSchema(cars.length), websiteSchema(), faqSchema(HOME_FAQ)],
  });
}

export function carsIndex({ cars, categories }) {
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span>Engines</span></nav>
<h1>All ${cars.length} engine sounds</h1>
<p class="lead">Every engine in SuperRev, playable in your browser. Pick one to rev it.</p>
<input class="filter" type="search" placeholder="Search engines, e.g. Skyline or V12" aria-label="Search engines" data-filter>
${categories.map((cat) => `<section class="cat-section" data-cat><h2><a href="/cars/${cat.slug}/">${esc(cat.name)}</a></h2><ul class="car-grid">
${cars.filter((c) => c.category === cat.name).map(carCard).join('\n')}
</ul></section>`).join('\n')}
<script>document.querySelector('[data-filter]').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.car-grid li').forEach(li=>li.hidden=!li.textContent.toLowerCase().includes(q));document.querySelectorAll('[data-cat]').forEach(s=>s.hidden=![...s.querySelectorAll('li')].some(li=>!li.hidden))})</script>`;
  return page({
    title: `All ${cars.length} Engine Sounds — Supercars, JDM, V8, V12 | SuperRev`,
    description: `Browse all ${cars.length} SuperRev engine sounds by category: Legendary V8 and V10, Exotic V12, JDM legends and more. Rev any of them free in your browser.`,
    path: '/cars/', body,
    schemas: [breadcrumbSchema([['Home', '/'], ['Engines', '/cars/']])],
  });
}

export function categoryPage({ cat, cars }) {
  const list = cars.filter((c) => c.category === cat.name);
  const path = `/cars/${cat.slug}/`;
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/cars/">Engines</a> / <span>${esc(cat.name)}</span></nav>
<h1>${esc(cat.name)} engine sounds</h1>
<p class="lead">${esc(cat.intro)}</p>
<ul class="car-grid">${list.map(carCard).join('\n')}</ul>
${appSection(cars.length)}`;
  return page({
    title: fit(70, `${cat.name} Engine Sounds — Rev Them Online | SuperRev`, `${cat.name} Engine Sounds | SuperRev`),
    description: fit(160, `${list.length} ${cat.name} engine sounds you can rev free in your browser, from ${list[0].name} to ${list.at(-1).name}. Drive with them in the SuperRev app.`,
      `${list.length} ${cat.name} engine sounds you can rev free in your browser. Drive with them in the SuperRev app.`),
    path, body,
    schemas: [breadcrumbSchema([['Home', '/'], ['Engines', '/cars/'], [cat.name, path]])],
  });
}

export function carPage({ car, cat, cars }) {
  const path = `/cars/${car.slug}/`;
  const peers = cars.filter((c) => c.category === car.category && c.id !== car.id);
  const at = Math.max(0, cars.filter((c) => c.category === car.category).findIndex((c) => c.id === car.id));
  const similar = [...peers.slice(at), ...peers.slice(0, at)].slice(0, 6);
  const faq = carFaq(car);
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/cars/">Engines</a> / <a href="/cars/${cat.slug}/">${esc(cat.name)}</a> / <span>${esc(car.name)}</span></nav>
<section class="car-hero">
<h1>${esc(car.name)} engine sound</h1>
<p class="spec">${esc(car.engine ?? 'SuperRev signature engine')} · idle ${fmt(car.idle)} rpm · redline ${fmt(car.redline)} rpm</p>
</section>
${demoBlock(car)}
<section class="about">${carParagraphs(car, cat).map((p) => `<p>${esc(p)}</p>`).join('\n')}</section>
${appSection(cars.length)}
<section class="similar" data-similar><h2>Similar engines</h2><ul class="car-grid">${similar.map(carCard).join('\n')}</ul>
<p><a href="/cars/${cat.slug}/">All ${esc(cat.name)} engines →</a></p></section>
${faqBlock(faq)}
<p class="disclaimer muted">${DISCLAIMER}</p>`;
  return page({
    title: fit(70, `${car.name} Engine Sound — Rev It Online | SuperRev`, `${car.name} Engine Sound | SuperRev`, `${car.name} Engine Sound`),
    description: carDescription(car),
    path, body, demo: true,
    schemas: [breadcrumbSchema([['Home', '/'], ['Engines', '/cars/'], [cat.name, `/cars/${cat.slug}/`], [car.name, path]]), faqSchema(faq)],
  });
}

export function notFound() {
  return page({
    title: 'Page not found | SuperRev',
    description: 'This page does not exist. Browse all SuperRev engine sounds and rev any of them free in your browser.',
    path: '/404/',
    body: `<section class="hero"><h1>Stalled. <span>This page doesn't exist.</span></h1>
<p class="lead"><a class="btn btn-red" href="/cars/">Browse all engines</a></p></section>`,
  }).replace(/<link rel="canonical"[^>]*>\n/, '<meta name="robots" content="noindex">\n');
}
