# superev.app Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, SEO-first site on superev.app where visitors rev all 133 SuperRev engines in the browser and are pushed to the app for GPS mode and acceleration sync.

**Architecture:** A dependency-free Node generator (`build.mjs`) reads `data/cars.json` (extracted once from the app's Dart catalog) and writes plain HTML for home, `/cars/`, category hubs and 133 car pages, plus sitemap/robots, into `public/`. One browser module pair ports the app's audio engine: `engine-core.js` (pure math, unit-tested in Node) and `engine-audio.js` (Web Audio wiring). Deployed to Vercel from the VPS; DNS on Namecheap.

**Tech Stack:** Node 22 (built-in `node:test`, no npm deps for build), vanilla JS ES modules, Web Audio API, CSS, Vercel static hosting, `@wasm-audio-decoders/ogg-vorbis` (pinned, jsDelivr, Safari fallback only).

**Spec:** `docs/design.md` (approved 2026-11-26)

## Global Constraints

- Work on the VPS: repo `/root/superev-site`, GitHub `digiforcebusiness-cmyk/superev-site` (public), Vercel account `digiforcebusiness-cmyk` (already logged in on the VPS).
- Packs come from GitHub `digiforcebusiness-cmyk/SuperRev` branch `feat/plan-2-audio-engine`, `assets/sounds/packs/<id>/{idle,low_on,low_off,med_on,med_off,high_on,high_off,maxRPM,startup}.ogg`, copied to `public/packs/<id>/`.
- Palette (from the app): bg `#050608`, surface `#0F1115`, outline `#2A2D33`, red `#FF3B30`, text `#E6E8EC`, muted `#6B7079`.
- Store links: iOS `https://apps.apple.com/app/id6770043689?ct=superev`, Android `https://play.google.com/store/apps/details?id=com.tuning3d.engine.sounds&referrer=utm_source%3Dsuperev`.
- Privacy `https://www.servepointpos.com/superrev/privacy`, support `https://www.servepointpos.com/superrev/contact`.
- Canonical origin `https://superev.app`; clean URLs with trailing slash (`/cars/ferrari-458-italia/`).
- Web limit: every engine fully playable; after **60 s of revving per visit** a dismissible app card; engine stays playable after dismissing.
- Car pages carry: "Engine-inspired simulations. Not affiliated with or endorsed by any vehicle manufacturer." No manufacturer logos.
- Engine values copied from the app (see Task 2). Listening modes: EXHAUST open/1.0, INTAKE 11916 Hz/0.9257, SIDE open/1.1727, CABIN 2600 Hz/1.2547, Q 1, glide τ 0.12 s.
- No render-blocking JS; audio and decoder load only after the visitor presses Start.
- English only (v1).

## Review Focus

1. **Start pressed before packs finish loading / pressed twice** → one engine instance, a loading state on the button, no doubled audio. Test in Task 3.
2. **Switching car while revving** → old voices stop and their buffers release; no overlapping engines. Test in Task 3.
3. **Safari/iOS can't decode Ogg Vorbis natively** → the WASM fallback decodes; the page never stays silent without a message. Test in Task 3.
4. **JavaScript disabled / crawler view** → every page's title, H1, specs text, FAQ and store links are in the HTML. Test in Task 4.
5. **Tab hidden mid-rev** → throttle releases and the AudioContext suspends; resumes on return. Test in Task 3.

---

### Task 1: Repo scaffold + car data

**Files:**
- Create: `package.json` (`"type":"module"`, scripts `build`, `test`), `.gitignore`, `scripts/extract-cars.mjs`, `scripts/sync-packs.sh`, `data/cars.json`, `data/categories.json`
- Test: `test/data.test.mjs`

**Interfaces:**
- Produces: `data/cars.json` = `Car[]`, `Car = {id, slug, name, engine|null, category, idle, redline}` in app carousel order; `data/categories.json` = `{slug, name, intro}[]` — one entry per distinct catalog category (≈6–7) + `"Signature Sounds"` for the 32 generic engines incl. `rotary_x8`, `i6_german`. Page counts below use `C = categories.length`.

- [ ] **Step 1: Write the failing test** `test/data.test.mjs`: `cars.length === 133`; slugs unique and match `/^[a-z0-9-]+$/`; every car's `category` exists in categories.json; `idle < redline`; `cars[0].id === 'rotary_x8'`; Ferrari 458 Italia has `engine === '4.5L Naturally Aspirated V8'`, `idle 900`, `redline 9000`; every `public/packs/<id>/` has the 9 `.ogg` files.
- [ ] **Step 2: Run** `node --test` → FAIL (files missing).
- [ ] **Step 3: Implement** `extract-cars.mjs` (regex over `lib/cars/named_car_catalog.dart` `NamedEngine("id","name","engine","category",idle,redline)` and `car_catalog.dart` `_performance('id','Name',idle,redline,fd)`; `_rotaryX8()`/`_i6German()` idle/redline read from their builders; slug = kebab of name with diacritics stripped). Write `categories.json` intros (2–3 sentences each, human copy). `sync-packs.sh` sparse-clones the SuperRev branch and rsyncs packs into `public/packs/`.
- [ ] **Step 4: Run** `node --test` → PASS.
- [ ] **Step 5: Commit** `feat: car catalog data and packs`.

### Task 2: Engine core (pure)

**Files:** Create `public/js/engine-core.js`; Test `test/engine-core.test.mjs`

**Interfaces:**
- Produces:
  - `bandCenters(idle, redline) -> number[5]` = `[idle, idle+.28s, idle+.55s, idle+.80s, redline]`, `s = redline-idle`
  - `bandWeight(i, rpm, centers) -> number` (triangular; ends hold 1.0)
  - `layerTargets(rpm, load, centers, viewLevel, t) -> {gain:number, rate:number}[8]` in order idle, low_on, low_off, med_on, med_off, high_on, high_off, maxRPM: weight `.62*sqrt(bandWeight)*(0.38+0.62*sqrt(load))*limiter*OUTPUT_GAIN*viewLevel`, on/off split `sqrt(load)` / `sqrt(1-load)`, rate `clamp(rpm/center, .55, 2)`, limiter `.78+.22*cos(2π*15*t)` when `rpm >= redline*.985 && load > .7`, `OUTPUT_GAIN = 2.8183829312644537`
  - `class RpmSim { constructor(car); step(dt, throttle) -> {rpm, gear, speed} }` — port of the app's `SimulatedRpmSource._onTick` for the parked case (pedal τ .45 up / .16 down; virtual speed accel `clamp((redline-idle)/2300, 1.4, 4.2) * throttle * shiftDrive / (1+gear*.6)`, coast 3 m/s²; gears `[3.54,2.19,1.52,1.19,1.0,0.84]`, final drive 3.9, wheel 2.02 m; upshift at `redline*.93` (named) / `.91` (generic), downshift `.32`/`.34`, cooldown .25 s, shift dip .16 s; launch rpm `min(1800,(red-idle)*.18)`; attack τ .22, decay τ .35, post-shift τ .06; rpm clamped idle..redline)
  - `VIEWS = {exhaust:{cutoff:22000,level:1}, intake:{cutoff:11916,level:.9257}, side:{cutoff:22000,level:1.1727}, cabin:{cutoff:2600,level:1.2547}}`, `glideView(current, target, dt) -> {cutoff, level}` (log-frequency, τ .12)
  - `revBudget(limitSec=60)` → `{add(dt, throttle) -> boolean exhausted}` counting only seconds with throttle > .05

- [ ] **Step 1: Failing tests** — `bandWeight(0, idle)===1`; `bandWeight(0, 5000)` with 800/8000 `===0`; at rpm 8000, load 1, view 1, no limiter: maxRPM gain `≈ .62*OUTPUT_GAIN`; idle at rpm=idle load 0 gain `≈ .62*.38*OUTPUT_GAIN`; RpmSim with Ferrari 458 held full throttle 10 s reaches gear ≥ 2 and rpm ≤ 9000, released 5 s returns to idle±50; `glideView` from exhaust to cabin after 1 s within 1% of 2600 Hz; `revBudget(60)` exhausted after 60.0 s of throttle, not after 600 s idle.
- [ ] **Step 2: Run** `node --test` → FAIL.
- [ ] **Step 3: Implement** in `engine-core.js` (no DOM, no Web Audio).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: engine core port`.

### Task 3: Web Audio engine + demo widget

**Files:** Create `public/js/engine-audio.js`, `public/js/demo.js`, `public/js/decode.js`; Test `test/demo.test.mjs` (fake AudioContext), manual check in Chrome + iPhone Safari.

**Interfaces:**
- Consumes: Task 2 exports.
- Produces: `mountDemo(rootEl, {carId, packBase:'/packs/', cars})` attaches to `<div data-demo data-car="<id>">`; `class EngineAudio { constructor(ctx); async load(car); start(); setThrottle(0..1); setView(name); stop(); dispose() }`; `decodeOgg(ctx, arrayBuffer) -> AudioBuffer` (native `decodeAudioData`, else lazy `import()` of `https://cdn.jsdelivr.net/npm/@wasm-audio-decoders/ogg-vorbis@<exact latest version at implementation time, pinned>/+esm`).

Graph: 8 looping `AudioBufferSourceNode`s → per-layer `GainNode` → `BiquadFilterNode` (lowpass, Q 1; bypass = frequency 22000) → `DynamicsCompressorNode` (threshold −2, knee 3, ratio 20, attack .001, release .06) → destination. Per animation frame: `RpmSim.step`, `layerTargets`, `setTargetAtTime(..., .02)` on gains / `playbackRate`. Startup one-shot at gain `.65*OUTPUT_GAIN`. UI: Start button (shows "Loading…" until all 9 buffers decode, disabled while loading), canvas tach (redline zone red), gear + RPM readout, hold-to-rev pedal (pointer + Space), 4 view tabs styled like the app (active red), car `<select>` on home only, 60 s budget card (store badges + "Keep revving here").

- [ ] **Step 1: Failing tests (fake ctx)** — double `start()` creates one set of sources; `load(carB)` while playing stops all carA sources; `visibilitychange` hidden → throttle 0 and `ctx.suspend` called; `decodeOgg` falls back to WASM when native rejects; budget card shown after 60 s simulated throttle and hidden on dismiss with audio still running.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual** — `npx serve public` (or `python3 -m http.server`), Chrome: Ferrari 458 revs to 9000 and shifts; modes audibly change; iPhone Safari (via VPS tunnel or deploy preview) produces sound.
- [ ] **Step 6: Commit** `feat: browser engine demo`.

### Task 4: Page generator + SEO

**Files:** Create `build.mjs`, `src/templates.mjs` (`page()`, `home()`, `carsIndex()`, `categoryPage()`, `carPage()`, `notFound()`), `src/seo.mjs` (`metaTags()`, `jsonLd*()`), `src/copy.mjs` (car paragraph + FAQ builders); Test `test/build.test.mjs`.

**Interfaces:**
- Consumes: `data/*.json`, demo markup contract `<div data-demo data-car="<id>">` + `<script type="module" src="/js/demo.js" defer>`.
- Produces: `public/index.html`, `public/cars/index.html`, `public/cars/<category-slug>/index.html` ×C, `public/cars/<car-slug>/index.html` ×132, `public/404.html`, `public/sitemap.xml`, `public/robots.txt`.

Car page title: `"<Name> Engine Sound — Rev It Online | SuperRev"` (trim to ≤ 60 chars by dropping " — Rev It Online"); description ≤ 160 chars naming engine + redline. Home title `"SuperRev — Rev Real Engine Sounds Online & In Your Car"`. Car paragraph combines name, engine, idle/redline, category intro sentence, and the app pitch; FAQ 3 Q/A (hear it online?; follow my real driving? → GPS mode; follow phone motion? → acceleration sync). JSON-LD: home `MobileApplication` (`operatingSystem` "iOS, Android", `applicationCategory` "EntertainmentApplication", `offers` price 0, `installUrl` both stores) + `WebSite`; car/category pages `BreadcrumbList` + `FAQPage` (car). Every page: canonical, OG/Twitter (`/og.png`), `apple-itunes-app` meta, theme-color `#050608`.

- [ ] **Step 1: Failing tests** — after `node build.mjs`: 135 + C HTML pages; titles unique and ≤ 60 chars; every page has exactly one canonical starting `https://superev.app/` ending `/`, one `<h1>`, meta description ≤ 160, parseable JSON-LD; every car page HTML (no JS) contains name, engine text, both store URLs, the disclaimer, and ≥ 3 "Similar engines" links; sitemap lists 134 + C URLs (all but 404); robots.txt has `Sitemap: https://superev.app/sitemap.xml`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: static page generator with SEO`.

### Task 5: Look & assets

**Files:** Create `public/css/site.css`, `public/img/` (official App Store / Google Play badges, 3 app screenshots from the app's store listing, `og.png` 1200×630 red/black with app icon + "Rev any engine", favicon + apple-touch-icon from the app icon `G:/Engine Sounds/icon.png`).

Hero with tach-glow background, red CTAs, app-style view tabs, condensed display font (self-hosted, `font-display: swap`) for headings, system UI body; mobile-first, no horizontal scroll at 360 px; WCAG AA contrast on muted text (lift to `#8A909A` where it fails).

- [ ] **Step 1: Failing test** — `test/build.test.mjs` adds: every page links `/css/site.css`; `og.png` is 1200×630; all `<img>` have `alt`, `width`, `height`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual** — screenshot home + one car page at 390 px and 1440 px; check against app look.
- [ ] **Step 6: Commit** `feat: red/black theme and assets`.

### Task 6: Deploy + domain

**Files:** Create `vercel.json` (`cleanUrls: true`, `trailingSlash: true`, `headers`: `/packs/(.*)` and `/js|css|img` → `Cache-Control: public, max-age=31536000, immutable`; HTML `max-age=0, must-revalidate`), `README.md` (how to rebuild).

- [ ] **Step 1:** `gh repo create digiforcebusiness-cmyk/superev-site --public --source . --push`.
- [ ] **Step 2:** `vercel link` + `vercel --prod`; if the upload exceeds Vercel's size limit, stop and ask about moving `/packs` to a CDN bucket.
- [ ] **Step 3:** `vercel domains add superev.app` and `www.superev.app` (www → apex 308).
- [ ] **Step 4:** Namecheap (Chrome, logged-in session): Advanced DNS for superev.app → remove parking records; A `@` 76.76.21.21; CNAME `www` cname.vercel-dns.com.
- [ ] **Step 5: Verify** — `curl -sI https://superev.app/` → 200; `https://www.superev.app/` → 308 to apex; `https://superev.app/cars/ferrari-458-italia/` → 200; a pack URL returns `audio/ogg` with the immutable cache header; `sitemap.xml` 200.
- [ ] **Step 6: Commit** `chore: vercel config`.

### Task 7: Launch checks

- [ ] PageSpeed Insights (mobile) on `/` and one car page: Performance ≥ 90, SEO 100, Accessibility ≥ 95; fix and redeploy anything under.
- [ ] Google Rich Results Test on one car page: Breadcrumb + FAQ detected.
- [ ] Real devices: Chrome Android and iPhone Safari rev a car, switch modes, see the 60 s card.
- [ ] Report the Search Console DNS verification step to the user (needs their Google account).
