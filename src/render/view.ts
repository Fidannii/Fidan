import { DEFS } from '../core/catalog';
import type { Cell, Game } from '../core/types';
import { cell, prog } from '../core/sim';
import { drawBuildingSprite, isoDiamond } from './sprites';

const TW = 56; // iso tile width
const TH = 28; // iso tile height

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export class View {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camX = 0;
  camY = 0;
  scale = 1.45;
  hover: { x: number; y: number } | null = null;
  particles: Particle[] = [];
  time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const p = this.canvas.parentElement!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = p.clientWidth;
    const h = p.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Grid → screen (tile center) */
  toScreen(wx: number, wy: number) {
    const s = this.scale;
    return {
      x: (wx - wy) * (TW / 2) * s + this.camX,
      y: (wx + wy) * (TH / 2) * s + this.camY,
    };
  }

  /** Screen → grid */
  toWorld(sx: number, sy: number) {
    const s = this.scale;
    const rx = (sx - this.camX) / s;
    const ry = (sy - this.camY) / s;
    const x = rx / (TW / 2) + ry / (TH / 2);
    const y = ry / (TH / 2) - rx / (TW / 2);
    return { x: x / 2, y: y / 2 };
  }

  center(g: Game) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const mid = (g.size - 1) / 2;
    const c = this.toScreen(mid, mid);
    // toScreen uses cam — temporarily zero
    const s = this.scale;
    const cx = (mid - mid) * (TW / 2) * s;
    const cy = (mid + mid) * (TH / 2) * s;
    this.camX = w / 2 - cx;
    this.camY = h * 0.42 - cy;
    void c;
  }

  spawnBurst(wx: number, wy: number, color: string, n = 10) {
    const p = this.toScreen(wx + 0.5, wy + 0.5);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.4 + Math.random() * 1.4;
      this.particles.push({
        x: p.x,
        y: p.y - 10,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 1,
        max: 0.6 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private sky(g: Game, w: number, h: number) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (g.region === 'desert') {
      grad.addColorStop(0, '#1c140c');
      grad.addColorStop(0.45, '#3a2814');
      grad.addColorStop(1, '#6b4a28');
    } else if (g.region === 'snow') {
      grad.addColorStop(0, '#0a1220');
      grad.addColorStop(0.5, '#1a2a3c');
      grad.addColorStop(1, '#3d5368');
    } else if (g.region === 'coast') {
      grad.addColorStop(0, '#071820');
      grad.addColorStop(0.5, '#0e3040');
      grad.addColorStop(1, '#1a5a5e');
    } else {
      grad.addColorStop(0, '#061018');
      grad.addColorStop(0.4, '#0a2430');
      grad.addColorStop(1, '#134e3a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // sun / moon glow
    const gx = w * 0.78;
    const gy = h * 0.16;
    const sun = ctx.createRadialGradient(gx, gy, 4, gx, gy, 120);
    if (g.region === 'desert') {
      sun.addColorStop(0, 'rgba(255,200,80,0.55)');
      sun.addColorStop(1, 'rgba(255,140,40,0)');
    } else if (g.region === 'snow') {
      sun.addColorStop(0, 'rgba(200,220,255,0.35)');
      sun.addColorStop(1, 'rgba(120,160,220,0)');
    } else {
      sun.addColorStop(0, 'rgba(120,220,180,0.25)');
      sun.addColorStop(1, 'rgba(60,160,120,0)');
    }
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    // drifting clouds
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 5; i++) {
      const cx = ((this.time * 0.01 * (0.3 + i * 0.1) + i * 220) % (w + 200)) - 100;
      const cy = 40 + i * 28;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 + i * 10, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 30, cy + 4, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private terrainColors(g: Game, c: Cell): { top: string; edge: string } {
    if (c.terrain === 'water') {
      const wave = 0.08 * Math.sin(this.time / 400 + c.x * 0.7 + c.y * 0.5);
      return {
        top: `rgba(${30 + wave * 40},${90 + wave * 30},${120 + wave * 40},0.95)`,
        edge: '#0d3a48',
      };
    }
    if (c.terrain === 'sand') {
      const alt = (c.x + c.y) % 2 === 0;
      return { top: alt ? '#d4b483' : '#c9a66b', edge: '#9a7a45' };
    }
    if (c.terrain === 'snow') {
      const alt = (c.x + c.y) % 2 === 0;
      return { top: alt ? '#e8f1f8' : '#d5e3ef', edge: '#9bb0c4' };
    }
    if (c.terrain === 'void') {
      return { top: '#0a100e', edge: '#050807' };
    }
    const alt = (c.x + c.y) % 2 === 0;
    if (g.region === 'coast') {
      return { top: alt ? '#1f6b52' : '#1a5c47', edge: '#0f3d30' };
    }
    return { top: alt ? '#2a8a5c' : '#247a51', edge: '#145536' };
  }

  private drawTile(g: Game, c: Cell) {
    const ctx = this.ctx;
    const s = this.scale;
    const { x: cx, y: cy } = this.toScreen(c.x, c.y);
    const hw = (TW / 2) * s;
    const hh = (TH / 2) * s;
    const cols = this.terrainColors(g, c);

    if (c.terrain === 'void') {
      isoDiamond(ctx, cx, cy, hw, hh, 'rgba(8,14,12,0.5)');
      return;
    }

    // extruded edge for depth
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx, cy + hh + 5 * s);
    ctx.lineTo(cx - hw, cy + 5 * s);
    ctx.closePath();
    ctx.fillStyle = cols.edge;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx, cy + hh + 5 * s);
    ctx.lineTo(cx + hw, cy + 5 * s);
    ctx.closePath();
    ctx.fillStyle = cols.edge;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    isoDiamond(ctx, cx, cy, hw, hh, cols.top, 'rgba(255,255,255,0.04)');

    // water shimmer
    if (c.terrain === 'water') {
      const shimmer = 0.15 + 0.1 * Math.sin(this.time / 300 + c.x + c.y);
      ctx.fillStyle = `rgba(180,230,255,${shimmer})`;
      ctx.beginPath();
      ctx.ellipse(cx + 4 * s, cy - 2 * s, 6 * s, 2 * s, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // grass tufts
    if (c.terrain === 'grass' && !c.b && (c.x * 13 + c.y * 7) % 11 === 0) {
      ctx.strokeStyle = 'rgba(180,255,200,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 2 * s, cy - 5 * s);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 2 * s, cy - 4 * s);
      ctx.stroke();
    }
  }

  draw(g: Game) {
    this.time = performance.now();
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    this.sky(g, w, h);

    if (g.disasterUntil && Date.now() < g.disasterUntil) {
      ctx.fillStyle = `rgba(180,40,20,${0.08 + 0.04 * Math.sin(this.time / 120)})`;
      ctx.fillRect(0, 0, w, h);
    }

    // depth sort: draw by x+y
    const tiles = g.cells.slice().sort((a, b) => a.x + a.y - (b.x + b.y));

    // island cliff under unlocked tiles
    for (const c of tiles) {
      if (c.terrain === 'void') continue;
      const p = this.toScreen(c.x, c.y);
      if (p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 120) continue;
      const neighbors = [
        [1, 0],
        [0, 1],
        [1, 1],
      ];
      const s = this.scale;
      const hw = (TW / 2) * s;
      const hh = (TH / 2) * s;
      const depth = 14 * s;
      for (const [dx, dy] of neighbors) {
        const n = g.cells.find((t) => t.x === c.x + dx && t.y === c.y + dy);
        if (n && n.terrain !== 'void') continue;
        ctx.beginPath();
        if (dx === 1 && dy === 0) {
          ctx.moveTo(p.x + hw, p.y);
          ctx.lineTo(p.x, p.y + hh);
          ctx.lineTo(p.x, p.y + hh + depth);
          ctx.lineTo(p.x + hw, p.y + depth);
        } else if (dx === 0 && dy === 1) {
          ctx.moveTo(p.x - hw, p.y);
          ctx.lineTo(p.x, p.y + hh);
          ctx.lineTo(p.x, p.y + hh + depth);
          ctx.lineTo(p.x - hw, p.y + depth);
        } else {
          ctx.moveTo(p.x, p.y + hh);
          ctx.lineTo(p.x, p.y + hh + depth);
          ctx.lineTo(p.x, p.y + hh + depth);
        }
        ctx.closePath();
        const cliff = ctx.createLinearGradient(p.x, p.y, p.x, p.y + depth);
        cliff.addColorStop(0, '#3d5c40');
        cliff.addColorStop(0.5, '#2a3d2e');
        cliff.addColorStop(1, '#121a14');
        ctx.fillStyle = cliff;
        ctx.fill();
      }
    }

    for (const c of tiles) {
      const p = this.toScreen(c.x, c.y);
      if (p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 80) continue;
      if (c.terrain === 'void') continue;
      this.drawTile(g, c);
    }

    // service radius under buildings
    if (g.focus) {
      const f = cell(g, g.focus.x, g.focus.y);
      const r = f?.b ? DEFS[f.b.id].radius : undefined;
      if (r && f?.b) {
        const rad = r + f.b.level - 1;
        const c = this.toScreen(g.focus.x, g.focus.y);
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, rad * (TW / 2) * this.scale * 1.1, rad * (TH / 2) * this.scale * 1.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100,210,255,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,210,255,0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (const c of tiles) {
      if (!c.b) continue;
      const p = this.toScreen(c.x, c.y);
      if (p.x < -100 || p.y < -120 || p.x > w + 100 || p.y > h + 100) continue;
      drawBuildingSprite(
        ctx,
        c.b.id,
        p.x,
        p.y,
        this.scale,
        c.b.level,
        this.time,
        c.b.wear,
      );

      // production ready pulse / progress
      if (DEFS[c.b.id].produce) {
        const pr = prog(g, c.x, c.y);
        if (c.b.ready > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(this.time / 180);
          ctx.beginPath();
          ctx.arc(p.x, p.y - 36 * this.scale, 7 * this.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,220,90,${0.55 + pulse * 0.4})`;
          ctx.fill();
          ctx.strokeStyle = '#fff8c8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // sparkle particles occasionally
          if (Math.random() < 0.08) this.spawnBurst(c.x, c.y, '#ffe566', 2);
        } else if (pr > 0) {
          ctx.beginPath();
          ctx.strokeStyle = '#3ecf8e';
          ctx.lineWidth = 3;
          ctx.arc(p.x, p.y - 36 * this.scale, 7 * this.scale, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // hover / select
    const mark = (x: number, y: number, color: string) => {
      const p = this.toScreen(x, y);
      const hw = (TW / 2) * this.scale;
      const hh = (TH / 2) * this.scale;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - hh);
      ctx.lineTo(p.x + hw, p.y);
      ctx.lineTo(p.x, p.y + hh);
      ctx.lineTo(p.x - hw, p.y);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // selection outline fill
      ctx.fillStyle = 'rgba(62, 207, 142, 0.12)';
      if (color === '#f4e27c') ctx.fillStyle = 'rgba(244, 226, 124, 0.12)';
      ctx.fill();
    };

    if (this.hover) mark(this.hover.x, this.hover.y, '#f4e27c');
    if (g.focus) mark(g.focus.x, g.focus.y, '#3ecf8e');

    // ghost placement
    if (g.selected && this.hover) {
      const p = this.toScreen(this.hover.x, this.hover.y);
      ctx.globalAlpha = 0.45;
      drawBuildingSprite(ctx, g.selected, p.x, p.y, this.scale, 1, this.time, 0);
      ctx.globalAlpha = 1;
    }

    // particles
    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.04;
      pt.life -= 0.02;
      if (pt.life <= 0) return false;
      ctx.globalAlpha = pt.life / pt.max;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * this.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });

    // vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // snow / desert dust
    if (g.region === 'snow' || g.region === 'desert') {
      ctx.fillStyle = g.region === 'snow' ? 'rgba(255,255,255,0.7)' : 'rgba(220,190,120,0.45)';
      for (let i = 0; i < 40; i++) {
        const px = (i * 97 + this.time * (g.region === 'snow' ? 0.04 : 0.08)) % w;
        const py = (i * 53 + this.time * 0.06) % h;
        ctx.fillRect(px, py, g.region === 'snow' ? 2 : 1.5, g.region === 'snow' ? 2 : 1);
      }
    }
  }
}
