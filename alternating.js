import { OrbitSystem } from './model.js?v=beam';

// Work in half-unit ticks so collision decisions use exact integer arithmetic.
export class AlternatingSystem extends OrbitSystem {
  reset() {
    super.reset();
    this.alternating = true;
    this.time = 1.5;
    this.primes = [1.5];
    this.beam = { number: 1.5, blocker: null };
  }

  eventAt(number) {
    const tick = Math.round(number * 2);
    const blocker = this.primes.find(value => {
      if (value >= number) return false;
      const period = Math.round(value * 2);
      return (2 * (tick - period) + (period % 2) * period) % (2 * period)
        === (tick % 2) * period;
    }) ?? null;
    return { number, blocker };
  }

  advance(elapsed) {
    this.pending += Math.max(0, elapsed);
    const next = (Math.floor(this.time * 2) + 1) / 2;
    const remaining = next - this.time;
    if (this.pending < remaining) {
      this.time += this.pending;
      this.pending = 0;
      return;
    }
    this.time = next;
    this.pending -= remaining;
    this.beam = this.eventAt(next);
    if (this.beam.blocker === null) this.primes.push(next);
  }

  async seek(time, { signal, yieldControl = () => new Promise(resolve => setTimeout(resolve, 0)) } = {}) {
    if (!Number.isFinite(time) || time < 1.5 || time > 100000) {
      throw new RangeError('Alternating preview supports times from 1.5 to 100000');
    }
    const target = new AlternatingSystem();
    let count = 0;
    while (target.time + .5 <= time) {
      if (signal?.aborted) return false;
      target.advance(.5);
      if (++count % 512 === 0) await yieldControl();
    }
    if (signal?.aborted) return false;
    target.time = time;
    Object.assign(this, target);
    return true;
  }
}
