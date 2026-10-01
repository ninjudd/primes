import { phase, radius, capacity } from './model.js?v=beam';

// Use continuous estimated spacing rather than the discrete number of primes.
// Fade the completed layer, not each tiny stroke: canvas alpha precision would
// otherwise make thousands of subpixel strokes accumulate into an opaque disk.
export function densityStyle(time, outer) {
  const spacing = Math.max(0, outer / capacity(time));
  const density = Math.min(1, spacing);
  return {
    ringOpacity: Math.min(1, spacing / .8),
    dotSize: Math.round(Math.max(.4, Math.max(1.2, Math.min(3.5, spacing * .23)) * Math.sqrt(density)) * 20) / 20,
    dotOpacity: Math.min(1, Math.sqrt(spacing / .3)),
    glow: Math.round(9 * density * 2) / 2,
  };
}

export function beamStyle(system, outer) {
  if (!system.beam) return null;
  const age = system.time - system.beam.number;
  if (age < 0 || age >= .45) return null;
  return {
    length: radius(system.beam.blocker ?? system.beam.number, system.time, outer),
    opacity: .7 * (1 - age / .45) ** 2,
    birth: system.beam.blocker === null,
  };
}

// Include 1: it is neither prime nor composite, but it is non-prime.
export function* nonPrimes(time, primes) {
  let index = 0;
  for (let number = 1; number <= Math.floor(time); number++) {
    if (primes[index] === number) index++;
    else yield number;
  }
}

// Rings share one radial scale, so a cached layer can contract continuously.
// Rebuild on births/resize and after 2% contraction to keep strokes crisp.
export class OrbitRenderer {
  constructor(canvas, makeCanvas = () => document.createElement('canvas')) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rings = makeCanvas();
    this.ringCtx = this.rings.getContext('2d');
    this.sprite = makeCanvas();
    this.spriteCtx = this.sprite.getContext('2d');
    this.dimSprite = makeCanvas();
    this.dimCtx = this.dimSprite.getContext('2d');
    this.count = -1;
    this.spriteKey = '';
  }

  resize(width, height, pixelRatio) {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    for (const canvas of [this.canvas, this.rings]) {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    }
    this.count = -1;
    this.spriteKey = '';
  }

  draw(system, showNonPrimes = false) {
    const { ctx, width, height, pixelRatio } = this;
    if (!width || !height) return;
    const outer = Math.max(0, Math.min(width, height) / 2 - 24);
    const style = densityStyle(system.time, outer);
    const { dotSize } = style;
    let scale = (this.ringTime + 4) / (system.time + 4);
    if (this.count !== system.primes.length || this.showNonPrimes !== showNonPrimes ||
        (showNonPrimes && this.integerTime !== Math.floor(system.time)) || scale < .98 || scale > 1) {
      this.paintRings(system, outer, dotSize, showNonPrimes);
      scale = 1;
    }
    const spriteKey = `${dotSize}:${style.glow}:${pixelRatio}`;
    if (spriteKey !== this.spriteKey) {
      this.paintSprite(dotSize, style.glow);
      this.spriteKey = spriteKey;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.globalAlpha = showNonPrimes ? Math.min(style.ringOpacity, outer / (system.time + 4) / .8) : style.ringOpacity;
    ctx.drawImage(this.rings, -width * scale / 2, -height * scale / 2, width * scale, height * scale);
    if (showNonPrimes) {
      // Extra dots have no glow and are drawn underneath the prime dots.
      ctx.globalAlpha = .22 * Math.min(style.dotOpacity, Math.sqrt(outer / (system.time + 4) / .3));
      for (const number of nonPrimes(system.time, system.primes)) {
        const r = radius(number, system.time, outer);
        const angle = phase(number, system.time) - Math.PI / 2;
        ctx.drawImage(this.dimSprite, Math.cos(angle) * r - 4, Math.sin(angle) * r - 4, 8, 8);
      }
    }
    ctx.globalAlpha = style.dotOpacity;
    for (const prime of system.primes) {
      const r = radius(prime, system.time, outer);
      const angle = phase(prime, system.time) - Math.PI / 2;
      ctx.drawImage(this.sprite, Math.cos(angle) * r - 16, Math.sin(angle) * r - 16, 32, 32);
    }
    ctx.globalAlpha = 1;
    this.paintBeam(system, outer);
  }

  paintBeam(system, outer) {
    const beam = beamStyle(system, outer);
    if (!beam) return;
    const ctx = this.ctx;
    ctx.globalAlpha = beam.opacity;
    ctx.strokeStyle = beam.birth ? '#ebd6a5' : '#9cb1b2';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -beam.length);
    ctx.stroke();
    // A small impact point stays on the zero ray as the pulse fades.
    ctx.beginPath();
    ctx.arc(0, -beam.length, beam.birth ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  paintRings(system, outer, dotSize, showNonPrimes) {
    const ctx = this.ringCtx;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.translate(this.width / 2, this.height / 2);
    ctx.lineWidth = .8;
    ctx.fillStyle = '#809d9b';
    if (showNonPrimes) {
      ctx.strokeStyle = 'rgba(128,157,155,.12)';
      // Merge rings that occupy the same physical pixel at dense scales.
      let lastPixel = -1;
      for (const number of nonPrimes(system.time, system.primes)) {
        const r = radius(number, system.time, outer);
        const pixel = Math.round(r * this.pixelRatio);
        if (pixel === lastPixel) continue;
        lastPixel = pixel;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    system.primes.forEach((prime, index) => {
      const r = radius(prime, system.time, outer);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${165 + 38 * Math.sin(index * .37)}, 25%, 60%, .3)`;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -r, Math.min(1.3, dotSize * .45), 0, Math.PI * 2);
      ctx.fill();
    });
    this.showNonPrimes = showNonPrimes;
    this.integerTime = Math.floor(system.time);
    this.count = system.primes.length;
    this.ringTime = system.time;
  }

  paintSprite(dotSize, glow) {
    const ctx = this.spriteCtx;
    this.sprite.width = this.sprite.height = Math.ceil(32 * this.pixelRatio);
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.beginPath();
    ctx.arc(16, 16, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = '#ebd6a5';
    ctx.shadowColor = '#ecd5a56b';
    ctx.shadowBlur = glow;
    ctx.fill();
    this.dimSprite.width = this.dimSprite.height = Math.ceil(8 * this.pixelRatio);
    const dim = this.dimCtx;
    dim.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    dim.beginPath();
    dim.arc(4, 4, dotSize, 0, Math.PI * 2);
    dim.fillStyle = '#9cb1b2';
    dim.fill();
  }
}
