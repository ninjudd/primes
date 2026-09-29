import { phase, radius, capacity } from './model.js?v=proportional';

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

  draw(system) {
    const { ctx, width, height, pixelRatio } = this;
    if (!width || !height) return;
    const outer = Math.max(0, Math.min(width, height) / 2 - 24);
    const dotSize = Math.round(Math.max(1.2, Math.min(3.5, outer / capacity(system.time) * .23)) * 10) / 10;
    let scale = (this.ringTime + 4) / (system.time + 4);
    if (this.count !== system.primes.length || scale < .98 || scale > 1) {
      this.paintRings(system, outer, dotSize);
      scale = 1;
    }
    const spriteKey = `${dotSize}:${pixelRatio}`;
    if (spriteKey !== this.spriteKey) {
      this.paintSprite(dotSize);
      this.spriteKey = spriteKey;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.drawImage(this.rings, -width * scale / 2, -height * scale / 2, width * scale, height * scale);
    for (const prime of system.primes) {
      const r = radius(prime, system.time, outer);
      const angle = phase(prime, system.time) - Math.PI / 2;
      ctx.drawImage(this.sprite, Math.cos(angle) * r - 16, Math.sin(angle) * r - 16, 32, 32);
    }
  }

  paintRings(system, outer, dotSize) {
    const ctx = this.ringCtx;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.translate(this.width / 2, this.height / 2);
    ctx.lineWidth = .8;
    ctx.fillStyle = '#809d9b';
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
    this.count = system.primes.length;
    this.ringTime = system.time;
  }

  paintSprite(dotSize) {
    const ctx = this.spriteCtx;
    this.sprite.width = this.sprite.height = Math.ceil(32 * this.pixelRatio);
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.beginPath();
    ctx.arc(16, 16, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = '#ebd6a5';
    ctx.shadowColor = '#ecd5a56b';
    ctx.shadowBlur = 9;
    ctx.fill();
  }
}
