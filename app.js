import { parseMoment, momentURL } from './sharing.js?v=nonprimes';
import { OrbitSystem } from './model.js?v=beam';
import { OrbitRenderer } from './renderer.js?v=zero-source';

const canvas = document.querySelector('canvas');
const renderer = new OrbitRenderer(canvas);
const play = document.querySelector('#play');
const reset = document.querySelector('#reset');
const speed = document.querySelector('#speed');
const speedValue = document.querySelector('#speed-value');
const share = document.querySelector('#share');
const status = document.querySelector('#share-status');
const fallback = document.querySelector('#share-link');
const primeToggle = document.querySelector('#primes-only');
const nonPrimeToggle = document.querySelector('#non-primes');
nonPrimeToggle.checked = new URLSearchParams(location.search).get('nonprimes') === '1';
primeToggle.checked = !nonPrimeToggle.checked;
const system = new OrbitSystem();
let loading = null;
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

function draw() { renderer.draw(system, nonPrimeToggle.checked); }
function changeNumberSet() {
  const params = new URLSearchParams(location.search);
  if (nonPrimeToggle.checked) params.set('nonprimes', '1');
  else params.delete('nonprimes');
  const query = params.toString();
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
  draw();
}
primeToggle.addEventListener('change', changeNumberSet);
nonPrimeToggle.addEventListener('change', changeNumberSet);

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
  loading?.abort();
  loading = null;
  play.disabled = share.disabled = false;
  status.textContent = '';
  fallback.hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
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
share.addEventListener('click', async () => {
  // Capture before any asynchronous work; keep this exact frame visible.
  const url = momentURL(system.time, nonPrimeToggle.checked);
  running = false;
  syncPlay();
  share.disabled = true;
  status.textContent = '';
  fallback.hidden = true;
  history.replaceState(null, '', location.pathname + location.search + `#${system.time}`);
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Prime Orbits', url });
      status.textContent = 'Shared';
    } else {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Link copied';
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      fallback.hidden = false;
      fallback.value = url;
      fallback.focus();
      fallback.select();
      status.textContent = 'Copy this link';
    }
  } finally {
    share.disabled = Boolean(loading);
  }
});

async function loadMoment() {
  loading?.abort();
  loading = null;
  const time = parseMoment(location.hash);
  if (time === null) {
    play.disabled = share.disabled = false;
    status.textContent = location.hash ? 'Invalid start number' : '';
    return;
  }
  const controller = new AbortController();
  loading = controller;
  running = false;
  syncPlay();
  play.disabled = share.disabled = true;
  fallback.hidden = true;
  status.textContent = 'Loading…';
  const restored = await system.seek(time, { signal: controller.signal });
  if (loading !== controller) return;
  loading = null;
  play.disabled = share.disabled = false;
  if (restored) { status.textContent = ''; draw(); }
}
window.addEventListener('hashchange', loadMoment);

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
loadMoment();
