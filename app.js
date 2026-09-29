import { OrbitSystem, phase, radius, capacity } from './model.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const play = document.querySelector('#play');
const reset = document.querySelector('#reset');
const speed = document.querySelector('#speed');
const speedValue = document.querySelector('#speed-value');
const system = new OrbitSystem();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let running = !reducedMotion.matches;
let rate = 1;
let previous = null;
let width = 0;
let height = 0;
let pixelRatio = 1;

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  draw();
}

function draw() {
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2);
  const outer = Math.max(0, Math.min(width, height) / 2 - 24);
  const spacing = outer / capacity(system.time);
  const dotSize = Math.max(1.2, Math.min(3.5, spacing * 0.23));
  for (let index = 0; index < system.primes.length; index++) {
    const prime = system.primes[index];
    const r = radius(index, system.time, outer);
    const angle = phase(prime, system.time) - Math.PI / 2;
    const hue = 165 + 38 * Math.sin(index * 0.37);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = `hsla(${hue}, 25%, 60%, .3)`;
    ctx.stroke();
    // The quiet mark at twelve o'clock is zero, without a numeric label.
    ctx.beginPath();
    ctx.arc(0, -r, Math.min(1.3, dotSize * 0.45), 0, Math.PI * 2);
    ctx.fillStyle = '#809d9b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = '#ebd6a5';
    ctx.shadowColor = '#ecd5a56b';
    ctx.shadowBlur = 9;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function syncPlay() {
  play.classList.toggle('paused', !running);
  play.setAttribute('aria-label', running ? 'Pause animation' : 'Play animation');
  play.title = `${running ? 'Pause' : 'Play'} (Space)`;
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
document.addEventListener('visibilitychange', () => { previous = null; });
reducedMotion.addEventListener('change', event => {
  if (event.matches) { running = false; previous = null; syncPlay(); }
});
new ResizeObserver(resize).observe(canvas);
window.addEventListener('resize', resize);

function frame(timestamp) {
  if (running && !document.hidden && previous !== null) {
    // Avoid a jump after a suspended tab or a stalled frame.
    system.advance(Math.min((timestamp - previous) / 1000, 0.1) * rate);
  }
  previous = timestamp;
  draw();
  requestAnimationFrame(frame);
}
syncPlay();
resize();
requestAnimationFrame(frame);
