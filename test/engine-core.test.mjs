import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OUTPUT_GAIN, bandCenters, bandWeight, layerTargets, RpmSim, VIEWS, glideView, revBudget,
} from '../public/js/engine-core.js';

const ferrari = { id: 'ferrari_458_italia', idle: 900, redline: 9000, category: 'Legendary V8' };
const generic = { id: 'street_rumble', idle: 750, redline: 6500, category: 'Signature Sounds' };
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('band centres spread like the app', () => {
  assert.deepEqual(bandCenters(800, 8000), [800, 800 + 7200 * .28, 800 + 7200 * .55, 800 + 7200 * .8, 8000]);
});

test('band weights: ends hold full weight, far bands are silent', () => {
  const c = bandCenters(800, 8000);
  assert.equal(bandWeight(0, 800, c), 1);
  assert.equal(bandWeight(4, 8000, c), 1);
  assert.equal(bandWeight(0, 5000, c), 0);
});

test('maxRPM layer at redline and full load carries the output gain', () => {
  const t = layerTargets(9000, 1, bandCenters(900, 9000), 1, 0.123, false);
  near(t[7].gain, .62 * OUTPUT_GAIN);
  assert.equal(t.length, 8);
});

test('idle layer at idle with no load', () => {
  const t = layerTargets(900, 0, bandCenters(900, 9000), 1, 0, false);
  near(t[0].gain, .62 * .38 * OUTPUT_GAIN);
  near(t[1].gain, 0); // low_on silent off-throttle
});

test('limiter wobbles gain only at redline with throttle', () => {
  const c = bandCenters(900, 9000);
  const free = layerTargets(9000, 1, c, 1, 1 / 60, false)[7].gain;
  const lim = layerTargets(9000, 1, c, 1, 1 / 60, true)[7].gain;
  near(lim, free * (.78 + .22 * Math.cos(2 * Math.PI * 15 / 60)));
});

test('playback rate tracks rpm / band centre, clamped', () => {
  const c = bandCenters(900, 9000);
  const t = layerTargets(9000, 1, c, 1, 0, false);
  near(t[7].rate, 1);
  assert.equal(t[0].rate, 2); // idle band stretched to 10x is clamped to 2.0
});

test('view level scales every layer', () => {
  const c = bandCenters(900, 9000);
  const a = layerTargets(5000, .5, c, 1, 0, false);
  const b = layerTargets(5000, .5, c, VIEWS.cabin.level, 0, false);
  for (let i = 0; i < 8; i++) near(b[i].gain, a[i].gain * 1.2547, 1e-9);
});

test('views carry the app values', () => {
  assert.deepEqual(VIEWS, {
    exhaust: { cutoff: 22000, level: 1 }, intake: { cutoff: 11916, level: .9257 },
    side: { cutoff: 22000, level: 1.1727 }, cabin: { cutoff: 2600, level: 1.2547 },
  });
});

test('RpmSim: held throttle climbs through gears, release returns to idle', () => {
  const sim = new RpmSim(ferrari);
  let s;
  for (let i = 0; i < 600; i++) s = sim.step(1 / 60, 1);
  assert.ok(s.gear >= 1, `gear ${s.gear} after 10 s`); // app: first shift ≈ 6 s
  for (let i = 0; i < 600; i++) s = sim.step(1 / 60, 1);
  assert.ok(s.gear >= 2, `gear ${s.gear} after 20 s`);
  assert.ok(s.rpm <= 9000 && s.rpm >= 900);
  for (let i = 0; i < 1800; i++) s = sim.step(1 / 60, 0);
  assert.ok(Math.abs(s.rpm - 900) <= 50, `rpm ${s.rpm}`);
});

test('RpmSim: generic engines upshift earlier than named ones (.91 vs .93)', () => {
  assert.equal(new RpmSim(generic).upshiftRpm, Math.round(6500 * .91));
  assert.equal(new RpmSim(ferrari).upshiftRpm, Math.round(9000 * .93));
});

test('RpmSim: limiter flag only near redline with pedal down', () => {
  const sim = new RpmSim(ferrari);
  assert.equal(sim.step(1 / 60, 0).limiter, false);
});

test('glideView reaches cabin cutoff within 1% after 1 s', () => {
  let v = { ...VIEWS.exhaust };
  for (let i = 0; i < 60; i++) v = glideView(v, VIEWS.cabin, 1 / 60);
  assert.ok(Math.abs(v.cutoff - 2600) / 2600 < .01, `${v.cutoff}`);
  near(v.level, 1.2547, .01);
});

test('revBudget counts only throttle time', () => {
  const b = revBudget(60);
  for (let i = 0; i < 600; i++) assert.equal(b.add(1, 0), false);
  for (let i = 0; i < 59; i++) assert.equal(b.add(1, 1), false);
  assert.equal(b.add(1, 1), true);
});
