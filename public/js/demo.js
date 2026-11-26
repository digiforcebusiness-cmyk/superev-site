// Binds the demo markup that build.mjs writes:
// <section data-demo data-car='{"id","idle","redline","category"}'> … </section>
import { EngineAudio } from './engine-audio.js';
import { createController } from './controller.js';

for (const root of document.querySelectorAll('[data-demo]')) mount(root);

function mount(root) {
  const $ = (s) => root.querySelector(s);
  const startBtn = $('[data-start]');
  const pedal = $('[data-pedal]');
  const picker = $('[data-picker]');
  const card = $('[data-limit]');
  const canvas = $('canvas');
  const rpmOut = $('[data-rpm]');
  const gearOut = $('[data-gear]');
  const status = $('[data-status]');
  let car = JSON.parse(root.dataset.car);
  let engine = null;
  let ctrl = null;
  drawTach(canvas, car, car.idle);

  async function boot() {
    startBtn.disabled = true;
    startBtn.textContent = 'Loading…';
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      engine = new EngineAudio(new Ctx({ latencyHint: 'interactive' }));
      engine.load(car);
      await engine.start();
      ctrl = createController({
        engine,
        onLimit: () => { card.hidden = false; },
        onState: (s) => {
          drawTach(canvas, car, s.rpm);
          rpmOut.textContent = Math.round(s.rpm).toLocaleString('en-US');
          gearOut.textContent = s.gear + 1;
        },
      });
      document.addEventListener('visibilitychange', () => engine.handleVisibility(document.hidden));
      let last = performance.now();
      const loop = (now) => { ctrl.frame((now - last) / 1000); last = now; requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      startBtn.disabled = false;
      running(true);
    } catch (e) {
      startBtn.disabled = false;
      startBtn.textContent = 'Start engine';
      status.textContent = "Sorry, this browser couldn't play the engine. Try Chrome, or get the app.";
      console.error(e);
    }
  }
  /** One button: Start engine ↔ Stop engine. */
  function running(on) {
    pedal.hidden = !on;
    if (on) pedal.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    pedal.classList.remove('is-down');
    startBtn.textContent = on ? 'Stop engine' : 'Start engine';
    startBtn.classList.toggle('btn-red', !on);
    startBtn.classList.toggle('btn-ghost', on);
    root.classList.toggle('is-running', on);
    status.textContent = on ? 'Engine running. Hold the pedal or press Space to rev.' : 'Engine off. Press Start engine to fire it up again.';
  }
  startBtn.addEventListener('click', async () => {
    if (!engine) return boot();
    if (engine.playing) { engine.stop(); running(false); return; }
    startBtn.disabled = true;
    await engine.start();
    startBtn.disabled = false;
    running(true);
  });

  const press = (v) => { if (engine?.playing) { engine.setThrottle(v); pedal.classList.toggle('is-down', v > 0); } };
  pedal.addEventListener('pointerdown', (e) => { pedal.setPointerCapture(e.pointerId); press(1); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) pedal.addEventListener(ev, () => press(0));
  pedal.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || !engine || e.target.closest?.('input,select,textarea')) return;
    e.preventDefault(); press(1);
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') press(0); });

  for (const btn of root.querySelectorAll('[data-view]')) {
    btn.addEventListener('click', () => {
      engine?.setView(btn.dataset.view);
      for (const b of root.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', b === btn);
    });
  }

  picker?.addEventListener('change', async () => {
    car = JSON.parse(picker.selectedOptions[0].dataset.car);
    root.dataset.car = JSON.stringify(car);
    const link = $('[data-car-link]');
    if (link) { link.href = `/cars/${picker.value}/`; link.textContent = `More about the ${car.name} →`; }
    drawTach(canvas, car, car.idle);
    if (engine) { status.textContent = 'Loading…'; await engine.load(car); status.textContent = 'Engine running.'; }
  });

  $('[data-dismiss]')?.addEventListener('click', () => { card.hidden = true; ctrl?.dismiss(); });
}

/** App-style tachometer: 240° dial, red zone from 90% of redline. */
function drawTach(canvas, car, rpm) {
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth || 300;
  if (canvas.width !== size * dpr) { canvas.width = canvas.height = size * dpr; }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2, r = size * .42;
  const max = Math.ceil(car.redline / 1000) * 1000;
  const a0 = Math.PI * .75, span = Math.PI * 1.5;
  const ang = (v) => a0 + span * (v / max);
  g.lineCap = 'round';
  g.lineWidth = size * .035;
  g.strokeStyle = '#1C1F24';
  g.beginPath(); g.arc(cx, cy, r, a0, a0 + span); g.stroke();
  g.strokeStyle = '#FF3B30';
  g.beginPath(); g.arc(cx, cy, r, ang(car.redline * .9), a0 + span); g.stroke();
  g.fillStyle = '#E6E8EC';
  g.font = `600 ${size * .045}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 0; k <= max; k += 1000) {
    const a = ang(k);
    g.fillText(k / 1000, cx + Math.cos(a) * r * .78, cy + Math.sin(a) * r * .78);
  }
  const a = ang(Math.min(rpm, max));
  g.strokeStyle = rpm >= car.redline * .9 ? '#FF3B30' : '#E6E8EC';
  g.lineWidth = size * .012;
  g.shadowColor = '#FF3B30'; g.shadowBlur = rpm >= car.redline * .9 ? 18 : 6;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * .92, cy + Math.sin(a) * r * .92); g.stroke();
  g.shadowBlur = 0;
  g.fillStyle = '#FF3B30';
  g.beginPath(); g.arc(cx, cy, size * .03, 0, Math.PI * 2); g.fill();
}
