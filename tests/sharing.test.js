import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoment, momentURL } from '../sharing.js';
import { OrbitSystem, phase } from '../model.js';

test('hash preserves exact fractional time and rejects malformed values', () => {
  for (const time of [2, 97, 12345.6789012345, 1000000.125]) {
    assert.equal(parseMoment(new URL(momentURL(time)).hash), time);
  }
  for (const hash of ['', '#', '#n', '#1', '#-5', '#Infinity', '#NaN', '#1e100', '#0xFF', '#22garbage', '#%32']) {
    assert.equal(parseMoment(hash), null);
  }
});

test('seek reconstructs the same primes and phases as uninterrupted animation', async () => {
  const original = new OrbitSystem();
  original.advance(97.625 - 2);
  while (original.pending) original.advance(0);
  const restored = new OrbitSystem();
  await restored.seek(parseMoment(new URL(momentURL(original.time)).hash));
  assert.equal(restored.time, original.time);
  assert.deepEqual(restored.primes, original.primes);
  assert.equal(restored.nextPrime, original.nextPrime);
  for (const prime of original.primes) assert.equal(phase(prime, restored.time), phase(prime, original.time));
  await restored.seek(101);
  assert.equal(restored.primes.at(-1), 101);
  assert.equal(phase(101, restored.time), 0);
  restored.advance(2);
  assert.equal(restored.time, 102);
  assert.equal(restored.beam.blocker, 2);
  restored.advance(0);
  assert.equal(restored.time, 103);
  assert.equal(restored.primes.at(-1), 103);
});

test('large starts yield and can be cancelled without replacing current state', async () => {
  const system = new OrbitSystem();
  const controller = new AbortController();
  let yields = 0;
  assert.equal(await system.seek(1e9, {
    signal: controller.signal,
    yieldControl: async () => { yields++; controller.abort(); },
  }), false);
  assert.equal(yields, 1);
  assert.equal(system.time, 2);
  assert.deepEqual(system.primes, [2]);
  await assert.rejects(system.seek(Infinity), RangeError);
});


test('shared links include the non-prime option only when selected', () => {
  assert.equal(momentURL(11.5, true), 'https://ninjudd.com/primes?nonprimes=1#11.5');
  assert.equal(momentURL(11.5, false), 'https://ninjudd.com/primes#11.5');
});
