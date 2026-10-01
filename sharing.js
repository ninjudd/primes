export function parseMoment(hash, minimum = 2) {
  const [value, divisor, ...extra] = hash.replace(/^#/, '').split('/');
  if (extra.length || (divisor !== undefined && !['1', '2', '4'].includes(divisor))) return null;
  if (!/^(?:\d+(?:\.\d+)?)(?:e[+-]?\d+)?$/i.test(value)) return null;
  const time = Number(value);
  return Number.isFinite(time) && time >= minimum && time <= Number.MAX_SAFE_INTEGER - 1024 ? time : null;
}

export function momentHash(time, divisions = 1) {
  return `#${time}${divisions === 1 ? '' : `/${divisions}`}`;
}

export function momentDivisions(hash) {
  const suffix = hash.split('/')[1];
  if (['1', '2', '4'].includes(suffix)) return Number(suffix);
  return 1;
}

export function momentURL(time, showNonPrimes = false, divisions = 1, showRings = true) {
  const params = new URLSearchParams();
  if (showNonPrimes) params.set('nonprimes', '1');
  if (!showRings) params.set('rings', '0');
  const query = params.toString();
  return `https://ninjudd.com/primes${query ? `?${query}` : ''}${momentHash(time, divisions)}`;
}
