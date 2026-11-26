import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EngineAudio } from '../public/js/engine-audio.js';
import { decodeOgg } from '../public/js/decode.js';
import { createController } from '../public/js/controller.js';

// --- minimal fake Web Audio -------------------------------------------------
const param = (v = 0) => ({ value: v, setTargetAtTime(x) { this.value = x; } });
class FakeCtx {
  constructor() { this.sources = []; this.currentTime = 0; this.sampleRate = 48000; this.state = 'running'; this.destination = {}; this.suspended = 0; }
  createBufferSource() {
    const s = { buffer: null, loop: false, playbackRate: param(1), started: false, stopped: false,
      connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
    this.sources.push(s); return s;
  }
  createGain() { return { gain: param(1), connect() {}, disconnect() {} }; }
  createBiquadFilter() { return { type: '', Q: param(), frequency: param(), connect() {}, disconnect() {} }; }
  createDynamicsCompressor() { return { threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect() {}, disconnect() {} }; }
  createBuffer(ch, len, rate) { return { numberOfChannels: ch, length: len, sampleRate: rate, copyToChannel() {} }; }
  async decodeAudioData() { return { duration: 1 }; }
  async suspend() { this.suspended++; this.state = 'suspended'; }
  async resume() { this.state = 'running'; }
}
const carA = { id: 'a', idle: 900, redline: 9000, category: 'Legendary V8' };
const carB = { id: 'b', idle: 800, redline: 7000, category: 'Signature Sounds' };
let fetches = 0;
const fetchBuf = async () => { fetches++; await new Promise((r) => setTimeout(r, 5)); return new ArrayBuffer(8); };

test('start before load finishes, or twice, makes one engine', async () => {
  const ctx = new FakeCtx();
  const e = new EngineAudio(ctx, { fetchBuffer: fetchBuf });
  const loading = e.load(carA);
  assert.equal(e.ready, false);
  await Promise.all([e.start(), e.start(), loading]);
  assert.equal(ctx.sources.filter((s) => s.loop && s.started && !s.stopped).length, 8);
});

test('switching car while playing stops every old source', async () => {
  const ctx = new FakeCtx();
  const e = new EngineAudio(ctx, { fetchBuffer: fetchBuf });
  await e.load(carA); await e.start();
  const old = ctx.sources.slice();
  await e.load(carB);
  assert.ok(old.every((s) => s.stopped), 'old sources stopped');
  assert.equal(ctx.sources.filter((s) => s.loop && s.started && !s.stopped).length, 8, 'new car playing');
});

test('hidden tab releases throttle and suspends audio; visible resumes', async () => {
  const ctx = new FakeCtx();
  const e = new EngineAudio(ctx, { fetchBuffer: fetchBuf });
  await e.load(carA); await e.start();
  e.setThrottle(1);
  await e.handleVisibility(true);
  assert.equal(e.throttle, 0);
  assert.equal(ctx.suspended, 1);
  await e.handleVisibility(false);
  assert.equal(ctx.state, 'running');
});

test('tick drives layer gains and the low-pass filter', async () => {
  const ctx = new FakeCtx();
  const e = new EngineAudio(ctx, { fetchBuffer: fetchBuf });
  await e.load(carA); await e.start();
  e.setView('cabin');
  let s;
  for (let i = 0; i < 120; i++) s = e.tick(1 / 60);
  assert.ok(s.rpm >= 900);
  assert.ok(e.filter.frequency.value < 3000, `cutoff ${e.filter.frequency.value}`);
});

test('decodeOgg falls back to the WASM decoder when native decode fails', async () => {
  const ctx = new FakeCtx();
  ctx.decodeAudioData = async () => { throw new Error('EncodingError'); };
  let loaded = 0;
  const loader = async () => { loaded++; return { OggVorbisDecoder: class {
    get ready() { return Promise.resolve(); }
    async decodeFile() { return { channelData: [new Float32Array(4), new Float32Array(4)], samplesDecoded: 4, sampleRate: 44100 }; }
    free() {} } }; };
  const buf = await decodeOgg(ctx, new ArrayBuffer(8), loader);
  assert.equal(loaded, 1);
  assert.equal(buf.numberOfChannels, 2);
  assert.equal(buf.sampleRate, 44100);
});

test('controller shows the app card once after 60 s of revving; dismiss keeps audio', () => {
  let shown = 0;
  const engine = { throttle: 1, stopped: false, tick() { return { rpm: 5000, gear: 1 }; }, stop() { this.stopped = true; } };
  const c = createController({ engine, limitSec: 60, onLimit: () => shown++ });
  for (let i = 0; i < 59 * 60; i++) c.frame(1 / 60);
  assert.equal(shown, 0);
  for (let i = 0; i < 2 * 60; i++) c.frame(1 / 60);
  assert.equal(shown, 1);
  c.dismiss();
  for (let i = 0; i < 600; i++) c.frame(1 / 60);
  assert.equal(shown, 1, 'card not re-shown in the same visit');
  assert.equal(engine.stopped, false, 'engine keeps running');
});
