import test from 'node:test';
import assert from 'node:assert/strict';
import { AlternatingSystem } from '../alternating.js';
import { beamStyle } from '../renderer.js';

test('alternating shots create bottom half-orbits and stop at actual aligned dots', async () => {
  const system = new AlternatingSystem();
  assert.equal(system.time, 1.5);
  assert.deepEqual(system.primes, [1.5]);
  assert.equal(beamStyle(system, 300).direction, -1);
  assert.ok(beamStyle(system, 300).impactY > 0);
  system.advance(.5);
  system.advance(.5);
  assert.deepEqual(system.primes, [1.5, 2, 2.5]);
  let beam = beamStyle(system, 300);
  assert.equal(beam.direction, -1);
  assert.ok(beam.impactY > 0);
  system.advance(.5);
  assert.equal(system.time, 3);
  assert.equal(beamStyle(system, 300).direction, 1);
  await system.seek(4.5);
  assert.deepEqual(system.beam, { number: 4.5, blocker: 1.5 });
  assert.ok(!system.primes.includes(4.5));
  assert.ok(Math.abs(beamStyle(system, 300).impactX) < 1e-10);
  assert.ok(beamStyle(system, 300).impactY > 0);
});

test('alternating seek agrees with playback and preserves each half tick', async () => {
  const live = new AlternatingSystem();
  for (let tick = 4; tick <= 80; tick++) live.advance(.5);
  const restored = new AlternatingSystem();
  await restored.seek(40);
  assert.deepEqual(restored.primes, live.primes);
  assert.deepEqual(restored.beam, live.beam);
  restored.advance(2);
  assert.equal(restored.time, 40.5);
  restored.advance(0);
  assert.equal(restored.time, 41);
  restored.reset();
  assert.equal(restored.alternating, true);
  assert.deepEqual(restored.primes, [1.5]);
});

test('half-step shared starts restore the first downward birth', async () => {
  const { parseMoment } = await import('../sharing.js');
  assert.equal(parseMoment('#1.5', 1.5), 1.5);
  assert.equal(parseMoment('#1.5'), null);
  const system = new AlternatingSystem();
  await system.seek(1.5);
  assert.deepEqual(system.beam, { number: 1.5, blocker: null });
  assert.deepEqual(system.primes, [1.5]);
});
