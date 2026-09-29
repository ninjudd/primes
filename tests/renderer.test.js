import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitRenderer, densityStyle, nonPrimes } from '../renderer.js';

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


test('dense scenes fade rings and reduce dots and glow without dropping orbits', () => {
  const sparse = densityStyle(97, 350);
  const medium = densityStyle(9007.125, 350);
  const dense = densityStyle(909007.125, 350);
  assert.equal(sparse.ringOpacity, 1);
  assert.equal(sparse.dotOpacity, 1);
  assert.equal(sparse.glow, 9);
  assert.ok(medium.ringOpacity < sparse.ringOpacity);
  assert.ok(dense.ringOpacity < .01);
  assert.ok(dense.dotOpacity < .2);
  assert.ok(dense.dotSize < medium.dotSize);
  assert.equal(dense.glow, 0);
  assert.ok(dense.dotSize > 0);
  for (const outer of [0, 136, 350, 700]) {
    for (const value of Object.values(densityStyle(909007.125, outer))) assert.ok(Number.isFinite(value) && value >= 0);
  }
  const canvas = surface();
  const renderer = new OrbitRenderer(canvas, surface);
  renderer.resize(800, 800, 2);
  const system = { time: 909007.125, primes: [2, 3, 5, 7, 11] };
  renderer.draw(system);
  assert.equal(canvas.calls.image.length, system.primes.length + 1);
  assert.equal(canvas.getContext().globalAlpha, 1);
});


test('non-prime mode includes 1 and composites, and toggles without changing time', () => {
  assert.deepEqual([...nonPrimes(11.5, [2, 3, 5, 7, 11])], [1, 4, 6, 8, 9, 10]);
  const canvas = surface();
  const renderer = new OrbitRenderer(canvas, surface);
  renderer.resize(800, 800, 1);
  const system = { time: 11.5, primes: [2, 3, 5, 7, 11] };
  renderer.draw(system, true);
  assert.equal(canvas.calls.image.filter(([image]) => image === renderer.dimSprite).length, 6);
  assert.equal(canvas.calls.image.filter(([image]) => image === renderer.sprite).length, 5);
  const strokes = renderer.rings.calls.stroke;
  canvas.calls.image.length = 0;
  renderer.draw(system, false);
  assert.equal(canvas.calls.image.length, 6);
  assert.ok(renderer.rings.calls.stroke > strokes);
  assert.equal(system.time, 11.5);
  renderer.draw(system, true);
  const beforeBirth = renderer.rings.calls.stroke;
  system.time = 12;
  canvas.calls.image.length = 0;
  renderer.draw(system, true);
  assert.equal(canvas.calls.image.filter(([image]) => image === renderer.dimSprite).length, 7);
  assert.ok(renderer.rings.calls.stroke > beforeBirth);
  system.time = 2; system.primes = [2];
  canvas.calls.image.length = 0;
  renderer.draw(system, true);
  assert.equal(canvas.calls.image.length, 3);
});
