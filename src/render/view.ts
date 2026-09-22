import { DEFS } from '../core/catalog';
import type { BuildId, Game } from '../core/types';
import { cell, prog } from '../core/sim';

const TILE = 40;

export class View {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camX = 0;
  camY = 0;
  scale = 1.4;
  hover: { x: number; y: number } | null = null;

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

  center(g: Game) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const map = g.size * TILE * this.scale;
    this.camX = (w - map) / 2;
    this.camY = (h - map) / 2;
  }

  toScreen(wx: number, wy: number) {
    return { x: wx * TILE * this.scale + this.camX, y: wy * TILE * this.scale + this.camY };
  }

  toWorld(sx: number, sy: number) {
    return {
      x: (sx - this.camX) / (TILE * this.scale),
      y: (sy - this.camY) / (TILE * this.scale),
    };
  }

  draw(g: Game) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    if (g.region === 'desert') {
      bg.addColorStop(0, '#1a1208');
      bg.addColorStop(1, '#3a2a14');
    } else if (g.region === 'snow') {
      bg.addColorStop(0, '#0b1520');
      bg.addColorStop(1, '#1a2a3a');
    } else if (g.region === 'coast') {
      bg.addColorStop(0, '#061820');
      bg.addColorStop(1, '#0d2f3a');
    } else {
      bg.addColorStop(0, '#06140f');
      bg.addColorStop(1, '#0f2e24');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (g.disasterUntil && Date.now() < g.disasterUntil) {
      ctx.fillStyle = 'rgba(180,40,20,0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    const ts = TILE * this.scale;

    if (g.focus) {
      const f = cell(g, g.focus.x, g.focus.y);
      const r = f?.b ? DEFS[f.b.id].radius : undefined;
      if (r) {
        const rad = r + (f!.b!.level - 1);
        const c = this.toScreen(g.focus.x + 0.5, g.focus.y + 0.5);
        ctx.beginPath();
        ctx.arc(c.x, c.y, (rad + 0.5) * ts, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76,201,240,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(76,201,240,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (const c of g.cells) {
      const { x: sx, y: sy } = this.toScreen(c.x, c.y);
      if (sx + ts < -2 || sy + ts < -2 || sx > w + 2 || sy > h + 2) continue;

      if (c.terrain === 'void') {
        ctx.fillStyle = '#080e0c';
        ctx.fillRect(sx, sy, ts, ts);
        continue;
      }

      if (c.terrain === 'water') ctx.fillStyle = '#163a48';
      else if (c.terrain === 'sand')
        ctx.fillStyle = (c.x + c.y) % 2 === 0 ? '#c2a067' : '#b39155';
      else if (c.terrain === 'snow')
        ctx.fillStyle = (c.x + c.y) % 2 === 0 ? '#d9e6f2' : '#c5d5e6';
      else ctx.fillStyle = (c.x + c.y) % 2 === 0 ? '#1b5c42' : '#174f39';

      ctx.fillRect(sx, sy, ts, ts);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.strokeRect(sx, sy, ts, ts);

      if (c.b) this.drawBuilding(g, c.x, c.y, c.b.id, sx, sy, ts);

      const hot =
        (this.hover && this.hover.x === c.x && this.hover.y === c.y) ||
        (g.focus && g.focus.x === c.x && g.focus.y === c.y);
      if (hot) {
        ctx.strokeStyle = g.focus?.x === c.x && g.focus?.y === c.y ? '#3ecf8e' : '#f4e27c';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(sx + 1.5, sy + 1.5, ts - 3, ts - 3);
        ctx.lineWidth = 1;
      }
    }

    if (g.selected && this.hover) {
      const { x: sx, y: sy } = this.toScreen(this.hover.x, this.hover.y);
      ctx.globalAlpha = 0.4;
      this.drawBuilding(g, this.hover.x, this.hover.y, g.selected, sx, sy, ts, true);
      ctx.globalAlpha = 1;
    }
  }

  private drawBuilding(
    g: Game,
    x: number,
    y: number,
    id: BuildId,
    sx: number,
    sy: number,
    ts: number,
    ghost = false,
  ) {
    const ctx = this.ctx;
    const d = DEFS[id];
    const b = cell(g, x, y)?.b;

    if (id === 'road' || id === 'highway') {
      ctx.fillStyle = ghost ? '#777' : id === 'highway' ? '#333' : '#4a4a4a';
      ctx.fillRect(sx + ts * 0.08, sy + ts * 0.08, ts * 0.84, ts * 0.84);
      ctx.fillStyle = id === 'highway' ? '#f4e27c' : '#bfbfbf';
      ctx.fillRect(sx + ts * 0.46, sy + ts * 0.16, ts * 0.08, ts * 0.68);
      if (id === 'highway') {
        ctx.fillRect(sx + ts * 0.16, sy + ts * 0.46, ts * 0.68, ts * 0.08);
      }
      return;
    }

    ctx.fillStyle = d.color;
    round(ctx, sx + ts * 0.14, sy + ts * 0.2, ts * 0.72, ts * 0.64, ts * 0.1);
    ctx.fill();

    if (b && b.wear > 25 && !ghost) {
      ctx.strokeStyle = `rgba(30,10,0,${b.wear / 120})`;
      ctx.beginPath();
      ctx.moveTo(sx + ts * 0.25, sy + ts * 0.3);
      ctx.lineTo(sx + ts * 0.5, sy + ts * 0.72);
      ctx.stroke();
    }

    ctx.font = `${Math.floor(ts * 0.38)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.icon, sx + ts / 2, sy + ts * 0.48);

    if (b && !ghost && (b.id === 'house' || (DEFS[b.id].radius && b.level > 1))) {
      ctx.font = `bold ${Math.floor(ts * 0.18)}px Outfit,sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(`L${b.level}`, sx + ts / 2, sy + ts * 0.78);
    }

    if (b && DEFS[b.id].produce && !ghost) {
      const p = prog(g, x, y);
      const cx = sx + ts * 0.82;
      const cy = sy + ts * 0.22;
      if (b.ready > 0) {
        const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 180);
        ctx.beginPath();
        ctx.arc(cx, cy, ts * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,226,124,${pulse})`;
        ctx.fill();
      } else if (p > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#3ecf8e';
        ctx.lineWidth = 3;
        ctx.arc(cx, cy, ts * 0.11, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
