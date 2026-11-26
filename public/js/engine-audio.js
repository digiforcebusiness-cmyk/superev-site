// Web Audio wiring for the ported SuperRev engine (maths in engine-core.js).
import {
  LAYERS, OUTPUT_GAIN, bandCenters, layerTargets, RpmSim, VIEWS, glideView,
} from './engine-core.js';
import { decodeOgg } from './decode.js';

const FILES = [...LAYERS, 'startup'];
const RAMP = .02;

export class EngineAudio {
  /**
   * @param ctx AudioContext
   * @param opts.fetchBuffer (url) => Promise<ArrayBuffer>
   * @param opts.packBase base URL of the packs, e.g. '/packs/'
   */
  constructor(ctx, { fetchBuffer = (u) => fetch(u).then((r) => r.arrayBuffer()), packBase = '/packs/' } = {}) {
    this.ctx = ctx;
    this.fetchBuffer = fetchBuffer;
    this.packBase = packBase;
    this.throttle = 0;
    this.view = { ...VIEWS.exhaust };
    this.viewName = 'exhaust';
    this.voices = [];
    this.playing = false;
    this.ready = false;
    this.t = 0;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.Q.value = 1;
    this.filter.frequency.value = this.maxCutoff;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2; limiter.knee.value = 3; limiter.ratio.value = 20;
    limiter.attack.value = .001; limiter.release.value = .06;
    this.filter.connect(limiter);
    limiter.connect(ctx.destination);
  }

  get maxCutoff() { return Math.min(22000, (this.ctx.sampleRate || 44100) / 2); }

  /** Load a car's 9 pack files. Replaces (and stops) any car already loaded. */
  load(car) {
    const wasPlaying = this.playing;
    this.stopVoices();
    this.car = car;
    this.ready = false;
    this.sim = new RpmSim(car);
    this.centers = bandCenters(car.idle, car.redline);
    const token = (this.loadToken = {});
    this.loading = Promise.all(FILES.map(async (f) =>
      decodeOgg(this.ctx, await this.fetchBuffer(`${this.packBase}${car.id}/${f}.ogg`)),
    )).then((buffers) => {
      if (token !== this.loadToken) return; // a newer load() won
      this.buffers = buffers;
      this.ready = true;
    });
    return this.loading.then(() => (wasPlaying && token === this.loadToken ? this.start() : undefined));
  }

  /** Start the loops and the one-shot startup sound. Idempotent; waits for load. */
  start() {
    if (this.starting) return this.starting;
    this.starting = (async () => {
      await this.loading;
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (this.playing) return;
      const now = this.ctx.currentTime;
      this.voices = LAYERS.map((_, i) => {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers[i];
        src.loop = true;
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        src.connect(gain); gain.connect(this.filter);
        src.start(now);
        return { src, gain };
      });
      const st = this.ctx.createBufferSource();
      st.buffer = this.buffers[LAYERS.length];
      const sg = this.ctx.createGain();
      sg.gain.value = .65 * OUTPUT_GAIN;
      st.connect(sg); sg.connect(this.filter);
      st.start(now);
      this.voices.push({ src: st, gain: sg, oneShot: true });
      this.playing = true;
    })().finally(() => { this.starting = null; });
    return this.starting;
  }

  setThrottle(v) { this.throttle = Math.min(1, Math.max(0, v)); }

  setView(name) { if (VIEWS[name]) this.viewName = name; }

  /** Advance the simulation and push gains/rates/cutoff. Returns the RPM state. */
  tick(dt) {
    if (!this.ready) return null;
    this.t += dt;
    const s = this.sim.step(dt, this.throttle);
    this.view = glideView(this.view, VIEWS[this.viewName], dt);
    if (!this.playing) return s;
    const now = this.ctx.currentTime;
    const targets = layerTargets(s.rpm, s.load, this.centers, this.view.level, this.t, s.limiter, s.gainScale);
    targets.forEach((tg, i) => {
      const v = this.voices[i];
      v.gain.gain.setTargetAtTime(Math.min(tg.gain, 4), now, RAMP);
      v.src.playbackRate.setTargetAtTime(tg.rate, now, RAMP);
    });
    this.filter.frequency.setTargetAtTime(Math.min(this.view.cutoff, this.maxCutoff), now, RAMP);
    return s;
  }

  /** Hidden tab: let off the pedal and pause audio. Visible again: resume. */
  async handleVisibility(hidden) {
    if (hidden) {
      this.setThrottle(0);
      if (this.ctx.state === 'running') await this.ctx.suspend();
    } else if (this.playing && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  stopVoices() {
    for (const v of this.voices) {
      try { v.src.stop(); } catch { /* already stopped one-shot */ }
      v.src.disconnect(); v.gain.disconnect();
    }
    this.voices = [];
    this.playing = false;
  }

  /** Engine off: silence, let off the pedal, and come back at idle next start. */
  stop() { this.setThrottle(0); this.stopVoices(); if (this.car) this.sim = new RpmSim(this.car); }

  dispose() { this.stopVoices(); this.buffers = null; this.ready = false; }
}
