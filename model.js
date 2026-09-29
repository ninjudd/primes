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
