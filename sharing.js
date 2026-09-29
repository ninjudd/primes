export function parseMoment(hash) {
  const value = hash.replace(/^#/, '');
  if (!/^(?:\d+(?:\.\d+)?)(?:e[+-]?\d+)?$/i.test(value)) return null;
  const time = Number(value);
  return Number.isFinite(time) && time >= 2 && time <= Number.MAX_SAFE_INTEGER - 1024 ? time : null;
}

export function momentURL(time) {
  return `https://ninjudd.com/primes#${time}`;
}
