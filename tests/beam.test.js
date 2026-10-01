import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitSystem, radius, phase } from '../model.js';
import { beamStyle } from '../renderer.js';

test('beam hits the first prime divisor or the newly born prime', () => {
  const system = new OrbitSystem();
  const expected = [null, null, 2, null, 2, null, 2, 3, 2, null, 2];
  for (let n = 2; n <= 12; n++) {
    if (n > 2) system.advance(1);
    assert.equal(system.time, n);
    assert.equal(system.beam.blocker, expected[n - 2]);
    const target = system.beam.blocker ?? n;
    assert.equal(phase(target, n), 0);
    assert.equal(beamStyle(system, 300).length, radius(target, n, 300));
    assert.equal(beamStyle(system, 300).birth, expected[n - 2] === null);
  }
});

test('dropped frames preserve every blocked event and prime birth', () => {
  const system = new OrbitSystem();
  system.advance(8.25);
  const events = [system.time];
  while (system.pending) { system.advance(0); events.push(system.time); }
  assert.deepEqual(events, [3, 4, 5, 6, 7, 8, 9, 10, 10.25]);
  assert.deepEqual(system.primes, [2, 3, 5, 7]);
});

test('seek restores the same pulse and it fades without changing the target', async () => {
  const system = new OrbitSystem();
  await system.seek(49.125);
  assert.deepEqual(system.beam, { number: 49, blocker: 7 });
  const start = beamStyle(system, 300);
  system.advance(.1);
  assert.ok(beamStyle(system, 300).opacity < start.opacity);
  system.advance(.3);
  assert.equal(beamStyle(system, 300), null);
  await system.seek(53);
  assert.deepEqual(system.beam, { number: 53, blocker: null });
  assert.ok(beamStyle(system, 300).birth);
  system.reset();
  assert.deepEqual(system.beam, { number: 2, blocker: null });
});
