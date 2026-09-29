import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitRenderer } from '../renderer.js';

function surface() {
  const calls = { arc: 0, stroke: 0, image: [] };
  const ctx = {
    setTransform() {}, clearRect() {}, translate() {}, beginPath() {}, fill() {},
    arc() { calls.arc++; }, stroke() { calls.stroke++; },
    drawImage(...args) { calls.image.push(args); },
  };
  return { calls, getContext: () => ctx };
}

test('steady frames reuse rings and glow while positions contract continuously', () => {
  const canvas = surface();
  const renderer = new OrbitRenderer(canvas, surface);
  renderer.resize(800, 800, 2);
  const system = { time: 10000, primes: Array.from({ length: 1000 }, (_, i) => i + 2) };
  renderer.draw(system);
  const ringArcs = renderer.rings.calls.arc;
  const spriteArcs = renderer.sprite.calls.arc;
  const firstWidth = canvas.calls.image[0][3];
  canvas.calls.image.length = 0;
  system.time += .016;
  renderer.draw(system);
  assert.equal(renderer.rings.calls.arc, ringArcs);
  assert.equal(renderer.sprite.calls.arc, spriteArcs);
  assert.equal(canvas.calls.image.length, 1001);
  assert.ok(canvas.calls.image[0][3] < firstWidth);
});

test('birth, reset, resize and substantial contraction invalidate the ring layer', () => {
  const renderer = new OrbitRenderer(surface(), surface);
  renderer.resize(800, 800, 1);
  const system = { time: 5, primes: [2, 3, 5] };
  renderer.draw(system);
  let strokes = renderer.rings.calls.stroke;
  for (const change of [
    () => { system.time = 7; system.primes.push(7); },
    () => { system.time = 2; system.primes = [2]; },
    () => renderer.resize(400, 600, 2),
    () => { system.time = 2.5; },
  ]) {
    change(); renderer.draw(system);
    assert.ok(renderer.rings.calls.stroke > strokes);
    strokes = renderer.rings.calls.stroke;
    assert.equal(renderer.ringTime, system.time);
  }
});
