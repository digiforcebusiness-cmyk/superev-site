# superev.app — SuperRev website design

_2026-11-26 · status: approved — web limit: all engines, 60 s per visit;
superrev.app: not now_

## Intent

A website on **superev.app** that turns Google searches into SuperRev installs.
Visitors rev real SuperRev engines in the browser; the things only a phone can
do — **GPS mode** (engine follows your real speed) and **acceleration sync**
(engine follows the phone's motion) — are the reason to download the iOS /
Android app. It must rank in search and look like the app: red on black.

**Success:** organic visits from "[car] engine sound"-type searches, and store
clicks from the site. **Failure even if it works:** pages slow enough to lose
ranking, a demo so complete nobody needs the app, a generic-template look, or
spec claims that misrepresent real cars.

## Goals / non-goals

- Goals: home page with a playable demo; one page per engine (133) plus
  category hubs; strong technical SEO; app-matching red/black design;
  fast on phones.
- Non-goals (v1): accounts, payments, GPS/motion on the web (deliberately
  app-only), translations, blog.

## Approaches (decided)

1. **Static HTML from a small generator script — chosen.** One Node script
   reads the app's car catalog and writes every page + sitemap as plain HTML,
   sharing one browser audio engine. Fastest pages, free static hosting.
2. Astro — same output via a framework; better for a future blog/i18n, more
   tooling than needed now.
3. Next.js — heavier, slower, no benefit for unchanging pages.

The user picked per-car pages (option B) and approach 1.

## Pages

| Path | Content |
|---|---|
| `/` | Hero ("Rev any engine. Then take it for a drive."), live demo with car picker, 4 listening modes, "only in the app" section (GPS mode, acceleration sync, 133 engines, offline), store badges, FAQ |
| `/cars/` | All 133 engines, grouped by category, searchable |
| `/cars/<category>/` | ~13 hubs (12 catalog categories + "Signature sounds" for the 32 generic engines): intro text written once per category, list of its engines |
| `/cars/<slug>/` | One per engine (below) |
| `/404.html` | On-brand, links to `/cars/` |
| privacy / support | link out to existing servepointpos.com/superrev/privacy and /contact |

**Car page** — H1 "`<Car>` engine sound"; spec line from the catalog
(e.g. "4.5L Naturally Aspirated V8 · idle 900 · redline 9,000 rpm"); the demo
preloaded with that engine; a unique paragraph assembled from the car's specs
plus its category intro; "Similar engines" (same category) for internal links;
2–3 FAQ entries (e.g. "Can I hear the `<Car>` follow my real driving?" → app
GPS mode); store CTA; breadcrumb. A small disclaimer: engine-inspired
simulations, not affiliated with any manufacturer, no logos.

## Browser demo

A port of the app's `AudioEngine` to the Web Audio API:

- same pack files (`idle`, `low/med/high_on/off`, `maxRPM`, `startup` .ogg),
  5 bands / 8 looping layers, triangular RPM crossfade, `playbackRate` =
  rpm / band centre (clamped 0.55–2.0), load gain `0.38 + 0.62·√load`,
  redline limiter wobble, +9 dB output gain → `DynamicsCompressorNode` as the
  limiter;
- RPM from a port of the app's simulated RPM source (throttle → rise/fall);
- the four listening modes with the app's exact values (BiquadFilter low-pass,
  Q 1; EXHAUST open/1.0, INTAKE 11.9 kHz/0.93, SIDE open/1.17, CABIN 2.6 kHz/
  1.25; 0.12 s glide);
- controls: "Start engine" button (browsers need a tap before audio), then
  hold the on-screen pedal / mouse / Space to rev; canvas tachometer in the
  app's style;
- audio loads only after the visitor presses Start (keeps pages fast).
- **Safari/iPhone:** if the browser can't decode Ogg Vorbis, load a small
  WebAssembly Vorbis decoder (pinned version, jsDelivr) on demand.

**Web limit (decided by the user):** every engine is fully
playable for 60 s of revving per visit; then a dismissible "Keep revving — and
hear it follow your real driving — in the app" card with store badges. The
car stays playable after dismissing.

## SEO

Per page: unique `<title>` / meta description / canonical / Open Graph +
Twitter tags; JSON-LD `MobileApplication` (home: name, OS, category, store
URLs, free) and `BreadcrumbList` + `FAQPage` on car pages; `sitemap.xml`,
`robots.txt`; Apple Smart App Banner (`apple-itunes-app`, app-id
6770043689); no render-blocking JS, audio and decoder lazy-loaded; semantic
HTML and accessible controls. Store links carry attribution (`ct=superev`
on App Store, `referrer=utm_source%3Dsuperev` on Play). Vercel Web
Analytics (cookie-less, no consent banner) for visits and store clicks.

## Look

App palette: background `#050608`, surface `#0F1115`, outline `#2A2D33`,
red `#FF3B30`, text `#E6E8EC`, muted `#6B7079`; red glow on the tach and
CTAs; real app screenshots in the "only in the app" section; official store
badges. Typeface: a condensed, technical display face for headings + system
UI for body (builder call).

## Build, hosting, domain

- Lives on the VPS in `/root/superev-site`, GitHub repo
  `digiforcebusiness-cmyk/superev-site`, deployed with the Vercel account
  already logged in there. Packs are copied in from the SuperRev repo at build.
- Domain: add superev.app (+ www → apex redirect) in Vercel; set Namecheap DNS
  (A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com) through the
  logged-in Namecheap session in Chrome. `.app` is HTTPS-only; Vercel issues
  the certificate.
- Size: the 133 packs are ~85 MB. If a Vercel limit rejects that, move the
  audio to a free CDN bucket (needs an account — would ask first).

## Needs you (decisions only you can make)

1. **How much the web gives away.** In the app only 3 engines are free; the
   rest cost an ad or the $9.99 purchase. My call above: all engines playable
   on the web, 60 s per visit, then an app nudge. Alternatives: only the 3
   free engines playable (others show a 10 s teaser), or no limit at all.
2. **superrev.app** (correct spelling) is unregistered. Registering it
   (~$15/yr) and redirecting to superev.app catches people who type the brand.
3. **Google Search Console** — after launch, verify the domain (I can do the
   DNS record) so you see search traffic.

## Left to the builder

Copy wording; category intro texts; exact tach drawing; FAQ wording; the
OG image; file layout of the generator; test approach (a smoke test that
every generated page has its title, canonical, JSON-LD, and a working pack
path).
