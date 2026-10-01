import { OrbitSystem } from './model.js?v=beam';

// Work in integer ticks so collision decisions use exact integer arithmetic.
export class AlternatingSystem extends OrbitSystem {
  constructor(divisions = 2) {
    super();
    this.divisions = divisions;
    this.reset();
  }

  reset() {
    super.reset();
    this.alternating = true;
    this.divisions ??= 2;
    this.time = 1 + 1 / this.divisions;
    this.primes = [this.time];
    this.beam = { number: this.time, blocker: null };
  }

  eventAt(number) {
    const tick = Math.round(number * this.divisions);
    const blocker = this.primes.find(value => {
      if (value >= number) return false;
      const period = Math.round(value * this.divisions);
      return (this.divisions * (tick - period) + (period % this.divisions) * period) % (this.divisions * period)
        === (tick % this.divisions) * period;
    }) ?? null;
    return { number, blocker };
  }

  advance(elapsed) {
    this.pending += Math.max(0, elapsed);
    const next = (Math.floor(this.time * this.divisions) + 1) / this.divisions;
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
    if (!Number.isFinite(time) || time < 1 + 1 / this.divisions || time > 100000) {
      throw new RangeError('Start time is outside the experiment range');
    }
    const target = new AlternatingSystem(this.divisions);
    let count = 0;
    while (target.time + 1 / this.divisions <= time) {
      if (signal?.aborted) return false;
      target.advance(1 / this.divisions);
      if (++count % 512 === 0) await yieldControl();
    }
    if (signal?.aborted) return false;
    target.time = time;
    Object.assign(this, target);
    return true;
  }
}
