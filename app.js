import { parseMoment, momentURL, momentHash, momentDivisions } from './sharing.js?v=hash-only';
import { AlternatingSystem } from './alternating.js?v=first-shot';
import { OrbitSystem } from './model.js?v=first-shot';
import { OrbitRenderer } from './renderer.js?v=dot-80-60';

const canvas = document.querySelector('canvas');
const renderer = new OrbitRenderer(canvas);
const play = document.querySelector('#play');
const reset = document.querySelector('#reset');
const speed = document.querySelector('#speed');
const speedValue = document.querySelector('#speed-value');
const share = document.querySelector('#share');
const ringsToggle = document.querySelector('#rings');
let showRings = new URLSearchParams(location.search).get('rings') !== '0';
function syncRings() {
  ringsToggle.setAttribute('aria-pressed', String(showRings));
  ringsToggle.setAttribute('aria-label', showRings ? 'Hide circles' : 'Show circles');
  ringsToggle.title = showRings ? 'Hide circles' : 'Show circles';
}
syncRings();
ringsToggle.addEventListener('click', () => {
  showRings = !showRings;
  const url = new URL(location.href);
  if (showRings) url.searchParams.delete('rings');
  else url.searchParams.set('rings', '0');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  syncRings();
  draw();
});
const status = document.querySelector('#share-status');
const fallback = document.querySelector('#share-link');
const primeToggle = document.querySelector('#primes-only');
const nonPrimeToggle = document.querySelector('#non-primes');
nonPrimeToggle.checked = new URLSearchParams(location.search).get('nonprimes') === '1';
primeToggle.checked = !nonPrimeToggle.checked;
let divisions = momentDivisions(location.hash);
let alternating = divisions !== 1;
let system = alternating
  ? new AlternatingSystem(divisions) : new OrbitSystem();
system.reset({ intro: true });
if (alternating) {
  canvas.setAttribute('aria-label', 'Alternating orbits. Shots rotate clockwise through the selected directions. Gold dots are unblocked births; gray dots show blocked candidates.');
  for (const [input, text, name] of [[primeToggle, 'ℙ', 'Unblocked births'], [nonPrimeToggle, 'ℕ', 'All candidates']]) {
    input.setAttribute('aria-label', name);
    const label = document.querySelector(`label[for="${input.id}"]`);
    label.textContent = text;
    label.title = name;
  }
}
const integerVersion = document.querySelector('#integer-version');
const halfVersion = document.querySelector('#half-version');
const quarterVersion = document.querySelector('#quarter-version');
integerVersion.checked = divisions === 1;
halfVersion.checked = divisions === 2;
quarterVersion.checked = divisions === 4;
async function changeVersion() {
  const nextDivisions = quarterVersion.checked ? 4 : halfVersion.checked ? 2 : 1;
  const time = Math.max(1 + .5 / nextDivisions, nextDivisions > 1 ? Math.min(system.time, 100000) : system.time);
  loading?.abort();
  const controller = new AbortController();
  loading = controller;
  schedule();
  play.disabled = share.disabled = true;
  const nextSystem = nextDivisions === 1 ? new OrbitSystem() : new AlternatingSystem(nextDivisions);
  const restored = await nextSystem.seek(time, { signal: controller.signal });
  if (loading !== controller) return;
  loading = null;
  play.disabled = share.disabled = false;
  if (!restored) { schedule(); return; }
  system = nextSystem;
  divisions = nextDivisions;
  alternating = divisions !== 1;
  integerVersion.checked = divisions === 1;
  halfVersion.checked = divisions === 2;
  quarterVersion.checked = divisions === 4;
  primeToggle.setAttribute('aria-label', alternating ? 'Unblocked births' : 'Prime numbers');
  nonPrimeToggle.setAttribute('aria-label', alternating ? 'All candidates' : 'All positive integers');
  canvas.setAttribute('aria-label', alternating
    ? 'Alternating number orbits. Shots rotate clockwise through the selected directions.'
    : 'Concentric prime orbits. Each orbit begins at the top and moves clockwise.');
  const url = new URL(location.href);
  url.searchParams.delete('experiment');
  url.hash = momentHash(system.time, divisions);
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  renderer.count = -1;
  status.textContent = '';
  fallback.hidden = true;
  draw();
  syncPlay();
}
integerVersion.addEventListener('change', changeVersion);
halfVersion.addEventListener('change', changeVersion);
quarterVersion.addEventListener('change', changeVersion);
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

function draw() { renderer.draw(system, nonPrimeToggle.checked, showRings); }
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
  if (running && !document.hidden && !loading) frameId = requestAnimationFrame(frame);
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
  system.reset({ intro: true });
  history.replaceState(null, '', location.pathname + location.search + (alternating ? momentHash(system.time, divisions) : ''));
  previous = null;
  draw();
  schedule();
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
  const url = momentURL(system.time, nonPrimeToggle.checked, divisions, showRings);
  running = false;
  syncPlay();
  share.disabled = true;
  status.textContent = '';
  fallback.hidden = true;
  history.replaceState(null, '', location.pathname + location.search + momentHash(system.time, divisions));
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
  if (momentDivisions(location.hash) !== divisions) {
    location.reload();
    return;
  }
  loading?.abort();
  loading = null;
  const time = parseMoment(location.hash, 1 + .5 / divisions);
  if (alternating && time > 100000) {
    status.textContent = 'Experiment supports start numbers up to 100000';
    return;
  }
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
  if (!running || document.hidden || loading) return;
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
