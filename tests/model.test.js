import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitSystem, capacity, radius, phase } from '../model.js';

test('discovers exactly the primes, including every skipped-frame birth at zero', () => {
  const system = new OrbitSystem();
  const births = [2];
  while (system.time < 97) {
    const count = system.primes.length;
    system.advance(1.6);
    if (system.primes.length !== count) {
      const prime = system.primes.at(-1);
      births.push(prime);
      assert.equal(system.time, prime);
      assert.equal(phase(prime, system.time), 0);
    }
  }
  assert.deepEqual(births, [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97]);
});

test('motion is continuous between integers and completes a turn in p units', () => {
  assert.equal(phase(7, 7.25), 2 * Math.PI * .25 / 7);
  assert.equal(phase(7, 14), 0);
  assert.ok(Math.abs(phase(7, 9.5) - phase(7, 16.5)) < 1e-12);
});

test('births retain elapsed time and reset clears pending time', () => {
  const system = new OrbitSystem();
  system.advance(1.5);
  assert.equal(system.time, 3);
  system.advance(.25);
  assert.equal(system.time, 3.75);
  system.advance(10);
  system.reset();
  assert.deepEqual(system.primes, [2]);
  assert.equal(system.time, 2);
  assert.equal(system.pending, 0);
  assert.equal(system.nextPrime, 3);
});

test('all radii, including two, contract continuously through prime births', () => {
  for (const time of [3, 5, 7, 11, 97, 997]) {
    const before = radius(2, time - 1e-6, 300);
    const after = radius(2, time + 1e-6, 300);
    assert.ok(before > after);
    assert.ok(before - after < .001);
  }
  assert.ok(radius(2, 100, 300) < radius(2, 2, 300));
});

test('capacity has room for every prime through one million', () => {
  const composite = new Uint8Array(1_000_001);
  let count = 0;
  let previousCapacity = capacity(2);
  for (let n = 2; n <= 1_000_000; n++) {
    if (!composite[n]) {
      count++;
      for (let multiple = n * n; multiple <= 1_000_000; multiple += n) composite[multiple] = 1;
    }
    assert.ok(capacity(n) > count);
    assert.ok(capacity(n) >= previousCapacity);
    previousCapacity = capacity(n);
  }
});

test('circumferences follow prime ratios and tangential speeds match', () => {
  for (const time of [11, 100, 10000]) {
    const r2 = radius(2, time, 300);
    for (const prime of [3, 5, 7, 11]) {
      const r = radius(prime, time, 300);
      assert.ok(Math.abs(r / r2 - prime / 2) < 1e-12);
      assert.ok(Math.abs(r * (2 * Math.PI / prime) - r2 * Math.PI) < 1e-12);
      assert.ok(r < 300);
    }
  }
});
