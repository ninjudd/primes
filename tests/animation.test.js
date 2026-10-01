import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { AlternatingSystem } from '../alternating.js';
import { OrbitSystem } from '../model.js';
import { parseMoment, momentURL, momentHash, momentDivisions } from '../sharing.js';

test('pause, share and hidden tabs stop scheduling; reset and resume keep one loop', async () => {
  const queue = new Map();
  let nextId = 0;
  let draws = 0;
  const element = () => ({
    listeners: {}, value: '0', classList: { toggle() {} },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    dispatchEvent(event) { this.listeners[event.type]?.(event); },
    setAttribute() {}, focus() {}, select() {}, getBoundingClientRect: () => ({ width: 800, height: 800 }),
  });
  const elements = Object.fromEntries(['canvas', '#play', '#reset', '#speed', '#speed-value', '#share', '#rings', '#share-status', '#share-link', '#non-primes', '#primes-only', '#integer-version', '#half-version', '#quarter-version'].map(key => [key, element()]));
  const doc = { ...element(), hidden: false, querySelector: key => elements[key] };
  const media = { ...element(), matches: false };
  let copied;
  const context = {
    parseMoment, momentURL, momentHash, momentDivisions, AbortController, URLSearchParams, URL,
    location: { href: 'http://localhost/primes/', hash: '', pathname: '/primes/', search: '' },
    history: { replaceState() {} },
    navigator: { clipboard: { async writeText(url) { copied = url; } } },
    document: doc, window: element(), matchMedia: () => media,
    OrbitSystem, AlternatingSystem, OrbitRenderer: class { resize() {} draw() { draws++; } },
    ResizeObserver: class { observe() {} }, Event: class { constructor(type) { this.type = type; } },
    requestAnimationFrame(fn) { const id = ++nextId; queue.set(id, fn); return id; },
    cancelAnimationFrame(id) { queue.delete(id); },
  };
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, context);
  assert.equal(queue.size, 1);
  elements['#play'].listeners.click();
  assert.equal(queue.size, 0);
  const pausedDraws = draws;
  elements['#reset'].listeners.click();
  assert.equal(draws, pausedDraws + 1);
  assert.equal(queue.size, 0);
  elements['#play'].listeners.click();
  assert.equal(queue.size, 1);
  doc.hidden = true; doc.listeners.visibilitychange();
  assert.equal(queue.size, 0);
  doc.hidden = false; doc.listeners.visibilitychange();
  assert.equal(queue.size, 1);
  const [id, frame] = [...queue][0]; queue.delete(id); frame(100);
  assert.equal(queue.size, 1);
  elements['#speed'].value = '2';
  elements['#speed'].listeners.input();
  elements['#quarter-version'].checked = true;
  elements['#integer-version'].checked = false;
  await elements['#quarter-version'].listeners.change();
  assert.equal(queue.size, 1);
  assert.equal(elements['#speed-value'].value, '4×');
  assert.equal(vm.runInNewContext('rate', context), 4);
  elements['#play'].listeners.click();
  elements['#quarter-version'].checked = false;
  elements['#half-version'].checked = true;
  await elements['#half-version'].listeners.change();
  assert.equal(queue.size, 0);
  assert.equal(elements['#speed-value'].value, '4×');
  elements['#half-version'].checked = false;
  elements['#integer-version'].checked = true;
  await elements['#integer-version'].listeners.change();
  assert.equal(queue.size, 0);
  await elements['#share'].listeners.click();
  assert.equal(copied, 'https://ninjudd.com/primes#1.5');
  assert.equal(queue.size, 0);
  assert.equal(elements['#share-status'].textContent, 'Link copied');
  context.location.hash = '#997.125';
  await context.window.listeners.hashchange();
  assert.equal(queue.size, 0);
  context.navigator.share = async ({ url }) => { copied = url; };
  await elements['#share'].listeners.click();
  assert.equal(copied, 'https://ninjudd.com/primes#997.125');
  context.navigator.share = async () => { throw Object.assign(new Error(), { name: 'AbortError' }); };
  await elements['#share'].listeners.click();
  assert.equal(elements['#share-link'].hidden, true);
  assert.equal(elements['#share'].disabled, false);
  delete context.navigator.share;
  context.navigator.clipboard.writeText = async () => { throw new Error('denied'); };
  await elements['#share'].listeners.click();
  assert.equal(elements['#share-link'].hidden, false);
  assert.equal(elements['#share-link'].value, 'https://ninjudd.com/primes#997.125');
  elements['#play'].listeners.click();
  media.listeners.change({ matches: true });
  assert.equal(queue.size, 0);
});
