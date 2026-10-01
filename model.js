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

  reset({ intro = false } = {}) {
    this.time = intro ? 1.5 : 2;
    this.primes = intro ? [] : [2];
    this.nextPrime = intro ? 2 : 3;
    this.pending = 0;
    this.beam = { number: 2, blocker: null };
  }

  async seek(time, { signal, yieldControl = () => new Promise(resolve => setTimeout(resolve, 0)) } = {}) {
    if (!Number.isFinite(time) || time < 1.5 || time > Number.MAX_SAFE_INTEGER - 1024) {
      throw new RangeError('Invalid start time');
    }
    if (time < 2) {
      if (signal?.aborted) return false;
      this.reset({ intro: true });
      this.time = time;
      return true;
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
    this.beam = this.eventAt(Math.floor(time));
    return true;
  }

  advance(elapsed) {
    this.pending += Math.max(0, elapsed);
    const nextInteger = Math.floor(this.time) + 1;
    const untilEvent = nextInteger - this.time;
    if (this.pending < untilEvent) {
      this.time += this.pending;
      this.pending = 0;
      return;
    }
    // Give each integer its own frame, including blocked composite events.
    // Retain unused elapsed time so births and collisions occur exactly at zero.
    this.time = nextInteger;
    this.pending -= untilEvent;
    this.beam = this.eventAt(nextInteger);
    if (nextInteger === this.nextPrime) {
      this.primes.push(this.nextPrime);
      let candidate = this.nextPrime === 2 ? 3 : this.nextPrime + 2;
      while (!this.isPrime(candidate)) candidate += 2;
      this.nextPrime = candidate;
    }
  }

  eventAt(number) {
    // The innermost orbit at zero is the smallest prime factor. Ignore the
    // number's own orbit, and ignore non-prime display orbits (especially 1).
    let blocker = null;
    for (const prime of this.primes) {
      if (prime * prime > number) break;
      if (number % prime === 0) { blocker = prime; break; }
    }
    return { number, blocker };
  }

  isPrime(candidate) {
    for (const prime of this.primes) {
      if (prime * prime > candidate) break;
      if (candidate % prime === 0) return false;
    }
    return true;
  }
}
