const TAU = Math.PI * 2;

// A smooth PNT-shaped capacity with headroom, independent of prime births.
// The offset keeps it increasing even at the small values where t/log(t) isn't.
export function capacity(time) {
  return 4 + 1.3 * (time + 4) / Math.log(time + 4);
}

// A common scale preserves circumference ratios and leaves room at the edge.
export function radius(prime, time, outerRadius) {
  return outerRadius * prime / (time + 4);
}

export function phase(prime, time) {
  return ((time - prime) % prime) / prime * TAU;
}

export class OrbitSystem {
  constructor() { this.reset(); }

  reset() {
    this.time = 2;
    this.primes = [2];
    this.nextPrime = 3;
    this.pending = 0;
  }

  async seek(time, { signal, yieldControl = () => new Promise(resolve => setTimeout(resolve, 0)) } = {}) {
    if (!Number.isFinite(time) || time < 2 || time > Number.MAX_SAFE_INTEGER - 1024) {
      throw new RangeError('Invalid start time');
    }
    const target = new OrbitSystem();
    let candidate = 3;
    let work = 0;
    // Generate in chunks so a large link can be cancelled without freezing the page.
    while (true) {
      if (signal?.aborted) return false;
      if (target.isPrime(candidate)) {
        if (candidate > time) break;
        target.primes.push(candidate);
      }
      candidate += 2;
      if (++work % 2048 === 0) await yieldControl();
    }
    if (signal?.aborted) return false;
    this.time = time;
    this.primes = target.primes;
    this.nextPrime = candidate;
    this.pending = 0;
    return true;
  }

  advance(elapsed) {
    this.pending += Math.max(0, elapsed);
    const untilBirth = this.nextPrime - this.time;
    if (this.pending < untilBirth) {
      this.time += this.pending;
      this.pending = 0;
      return;
    }
    // Render every birth at exactly p, even if a frame straddles the event.
    // Retain the remainder for the following frame instead of losing time.
    this.time = this.nextPrime;
    this.pending -= untilBirth;
    this.primes.push(this.nextPrime);
    let candidate = this.nextPrime + 2;
    while (!this.isPrime(candidate)) candidate += 2;
    this.nextPrime = candidate;
  }

  isPrime(candidate) {
    for (const prime of this.primes) {
      if (prime * prime > candidate) break;
      if (candidate % prime === 0) return false;
    }
    return true;
  }
}
