import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { OrbitSystem } from '../model.js';

test('pause and hidden tabs stop scheduling; reset and resume keep one loop', () => {
  const queue = new Map();
  let nextId = 0;
  let draws = 0;
  const element = () => ({
    listeners: {}, value: '0', classList: { toggle() {} },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    dispatchEvent(event) { this.listeners[event.type]?.(event); },
    setAttribute() {}, getBoundingClientRect: () => ({ width: 800, height: 800 }),
  });
  const elements = Object.fromEntries(['canvas', '#play', '#reset', '#speed', '#speed-value'].map(key => [key, element()]));
  const doc = { ...element(), hidden: false, querySelector: key => elements[key] };
  const media = { ...element(), matches: false };
  const context = {
    document: doc, window: element(), matchMedia: () => media,
    OrbitSystem, OrbitRenderer: class { resize() {} draw() { draws++; } },
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
  media.listeners.change({ matches: true });
  assert.equal(queue.size, 0);
});
