// Pure engine maths, ported from the SuperRev app (lib/audio/audio_engine.dart,
// lib/rpm/simulated_rpm_source.dart, lib/audio/listener_view.dart).
// No DOM and no Web Audio here, so it runs under `node --test`.

/** +9 dB makeup gain on every layer (AudioEngine.outputGain). */
export const OUTPUT_GAIN = 2.8183829312644537;

/** Layer order shared with engine-audio.js and the pack file names. */
export const LAYERS = ['idle', 'low_on', 'low_off', 'med_on', 'med_off', 'high_on', 'high_off', 'maxRPM'];

export function bandCenters(idle, redline) {
  const s = redline - idle;
  return [idle, idle + s * .28, idle + s * .55, idle + s * .8, redline];
}

/** Triangular crossfade: 1 at the band's centre, 0 at the neighbours'. */
export function bandWeight(i, rpm, c) {
  if (rpm <= c[i]) return i === 0 ? 1 : clamp((rpm - c[i - 1]) / (c[i] - c[i - 1]), 0, 1);
  return i === c.length - 1 ? 1 : clamp((c[i + 1] - rpm) / (c[i + 1] - c[i]), 0, 1);
}

/**
 * Gain and playback rate for the 8 layers (LAYERS order).
 * `load` 0..1 already includes the shift dip; `gainScale` is the dip applied
 * again to the load gain, as the app does; `limiter` = at the rev limiter.
 */
export function layerTargets(rpm, load, c, viewLevel, t, limiter, gainScale = 1) {
  const loadGain = (.38 + .62 * Math.sqrt(load)) * gainScale;
  const lim = limiter ? .78 + .22 * Math.cos(2 * Math.PI * 15 * t) : 1;
  const out = [];
  for (let i = 0; i < 5; i++) {
    const w = .62 * Math.sqrt(bandWeight(i, rpm, c)) * loadGain * lim * OUTPUT_GAIN * viewLevel;
    const rate = clamp(rpm / c[i], .55, 2);
    if (i === 0 || i === 4) out.push({ gain: w, rate });
    else out.push({ gain: w * Math.sqrt(load), rate }, { gain: w * Math.sqrt(1 - load), rate });
  }
  return out;
}

const GEARS = [3.54, 2.19, 1.52, 1.19, 1.0, 0.84];
const FINAL_DRIVE = 3.9;
const WHEEL_M = 2.02;

/** The app's simulated RPM source, parked case: the pedal drives a virtual launch. */
export class RpmSim {
  constructor(car) {
    const generic = car.category === 'Signature Sounds';
    this.car = car;
    this.upshiftRpm = Math.round(car.redline * (generic ? .91 : .93));
    this.downshiftRpm = Math.round(car.redline * (generic ? .34 : .32));
    this.rpm = car.idle;
    this.gear = 0;
    this.speed = 0;
    this.pedal = 0;
    this.sinceShift = .25;
    this.load = null;
    this.shiftLeft = 0;
  }

  baseRpm(gear) {
    return (this.speed / WHEEL_M) * 60 * GEARS[gear] * FINAL_DRIVE;
  }

  /** Advance by dt seconds with the requested pedal (0..1). */
  step(dt, requested) {
    const { idle, redline } = this.car;
    const pedalTau = requested > this.pedal ? .45 : .16;
    this.pedal += (requested - this.pedal) * (1 - Math.exp(-dt / pedalTau));
    const throttle = this.pedal;

    if (throttle > .05) {
      const demoAccel = clamp((redline - idle) / 2300, 1.4, 4.2);
      const shiftDrive = this.sinceShift < .16 ? .25 : 1;
      this.speed = clamp(this.speed + throttle * demoAccel * shiftDrive / (1 + this.gear * .6) * dt, 0, 100);
    } else {
      this.speed = Math.max(0, this.speed - 3 * dt);
    }

    this.sinceShift += dt;
    const ready = this.sinceShift >= .25;
    const prevGear = this.gear;
    if (ready && this.rpm > this.upshiftRpm && this.gear < GEARS.length - 1) {
      if (this.baseRpm(this.gear + 1) > idle + 500) { this.gear++; this.sinceShift = 0; }
    } else if (ready && this.rpm < this.downshiftRpm && this.gear > 0 &&
        this.baseRpm(this.gear - 1) < this.upshiftRpm * .95) {
      this.gear--; this.sinceShift = 0;
    }

    const slip = this.gear === 0 ? 1 : Math.exp(-this.speed / 4);
    const launch = idle + throttle * Math.min(1800, (redline - idle) * .18) * slip;
    const target = Math.max(this.baseRpm(this.gear), launch) + throttle * 100;
    const tau = this.sinceShift < .2 ? .06 : target > this.rpm ? .22 : .35;
    this.rpm = clamp(this.rpm + (1 - Math.exp(-dt / tau)) * (target - this.rpm), idle, redline);

    // AudioEngine.apply: smoothed engine load + brief cut on a gear change.
    if (this.load === null) this.load = requested;
    const loadTau = requested > this.load ? .045 : .09;
    this.load += (requested - this.load) * (1 - Math.exp(-dt / loadTau));
    if (this.gear !== prevGear) this.shiftLeft = .16;
    const shiftGain = 1 - .72 * (this.shiftLeft / .16);
    this.shiftLeft = Math.max(0, this.shiftLeft - dt);

    return {
      rpm: this.rpm, gear: this.gear, speed: this.speed,
      load: this.load * shiftGain, gainScale: shiftGain,
      limiter: this.rpm >= redline * .985 && requested > .7,
    };
  }
}

/** Listening modes (ListenerView): low-pass cutoff + level, from the app. */
export const VIEWS = {
  exhaust: { cutoff: 22000, level: 1 },
  intake: { cutoff: 11916, level: .9257 },
  side: { cutoff: 22000, level: 1.1727 },
  cabin: { cutoff: 2600, level: 1.2547 },
};

/** Glide toward a view: level linearly, cutoff in log frequency, tau 0.12 s. */
export function glideView(cur, target, dt) {
  const k = 1 - Math.exp(-dt / .12);
  return {
    level: cur.level + (target.level - cur.level) * k,
    cutoff: Math.exp(Math.log(cur.cutoff) + (Math.log(target.cutoff) - Math.log(cur.cutoff)) * k),
  };
}

/** Counts seconds of revving (throttle > .05); true once `limitSec` is used up. */
export function revBudget(limitSec = 60) {
  let used = 0;
  return {
    add(dt, throttle) { if (throttle > .05) used += dt; return used >= limitSec; },
    get used() { return used; },
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
