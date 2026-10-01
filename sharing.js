export function parseMoment(hash, minimum = 2) {
  const value = hash.replace(/^#/, '');
  if (!/^(?:\d+(?:\.\d+)?)(?:e[+-]?\d+)?$/i.test(value)) return null;
  const time = Number(value);
  return Number.isFinite(time) && time >= minimum && time <= Number.MAX_SAFE_INTEGER - 1024 ? time : null;
}

export function momentURL(time, showNonPrimes = false) {
  return `https://ninjudd.com/primes${showNonPrimes ? '?nonprimes=1' : ''}#${time}`;
}
