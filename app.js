import { OrbitSystem } from './model.js?v=proportional';
import { OrbitRenderer } from './renderer.js?v=cached';

const canvas = document.querySelector('canvas');
const renderer = new OrbitRenderer(canvas);
const play = document.querySelector('#play');
const reset = document.querySelector('#reset');
const speed = document.querySelector('#speed');
const speedValue = document.querySelector('#speed-value');
const system = new OrbitSystem();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let running = !reducedMotion.matches;
let rate = 1;
let previous = null;
let frameId = null;

function resize() {
  const rect = canvas.getBoundingClientRect();
  renderer.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
  draw();
}

function draw() { renderer.draw(system); }

function schedule() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  previous = null;
  if (running && !document.hidden) frameId = requestAnimationFrame(frame);
}

function syncPlay() {
  play.classList.toggle('paused', !running);
  play.setAttribute('aria-label', running ? 'Pause animation' : 'Play animation');
  play.title = `${running ? 'Pause' : 'Play'} (Space)`;
  schedule();
}

play.addEventListener('click', () => {
  running = !running;
  previous = null;
  syncPlay();
});
reset.addEventListener('click', () => {
  system.reset();
  previous = null;
  draw();
});
speed.addEventListener('input', () => {
  rate = 2 ** Number(speed.value);
  const label = `${Number(rate.toFixed(2))}×`;
  speedValue.value = label;
  speed.setAttribute('aria-valuetext', `${Number(rate.toFixed(2))} times normal speed`);
});
speed.dispatchEvent(new Event('input'));
window.addEventListener('keydown', event => {
  if (event.target.closest('button, input') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Space') { event.preventDefault(); play.click(); }
  if (event.key.toLowerCase() === 'r') reset.click();
});
document.addEventListener('visibilitychange', schedule);
reducedMotion.addEventListener('change', event => {
  if (event.matches) { running = false; previous = null; syncPlay(); }
});
new ResizeObserver(resize).observe(canvas);
window.addEventListener('resize', resize);

function frame(timestamp) {
  frameId = null;
  if (!running || document.hidden) return;
  if (running && !document.hidden && previous !== null) {
    // Avoid a jump after a suspended tab or a stalled frame.
    system.advance(Math.min((timestamp - previous) / 1000, 0.1) * rate);
  }
  previous = timestamp;
  draw();
  frameId = requestAnimationFrame(frame);
}
syncPlay();
resize();
