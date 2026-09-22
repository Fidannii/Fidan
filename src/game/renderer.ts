import { BUILDINGS, MAP_SIZE, type BuildingKind } from './data';
import { productionProgress, type GameState } from './sim';
import { tileAt } from './state';

const TILE = 40;

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camX = 0;
  camY = 0;
  scale = 1;
  hover: { x: number; y: number } | null = null;
  showRadius = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  worldToScreen(wx: number, wy: number) {
    return {
      x: wx * TILE * this.scale + this.camX,
      y: wy * TILE * this.scale + this.camY,
    };
  }

  screenToWorld(sx: number, sy: number) {
    return {
      x: (sx - this.camX) / (TILE * this.scale),
      y: (sy - this.camY) / (TILE * this.scale),
    };
  }

  centerOnMap() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const mapW = MAP_SIZE * TILE * this.scale;
    const mapH = MAP_SIZE * TILE * this.scale;
    this.camX = (w - mapW) / 2;
    this.camY = (h - mapH) / 2;
  }

  draw(state: GameState) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Atmospheric background
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#071a14');
    g.addColorStop(0.55, '#0d2f24');
    g.addColorStop(1, '#123d30');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Soft vignette glow
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    glow.addColorStop(0, 'rgba(62, 207, 142, 0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const ts = TILE * this.scale;

    // Radius preview for selected service
    if (this.showRadius && state.selectedTile) {
      const t = tileAt(state, state.selectedTile.x, state.selectedTile.y);
      const kind = t?.building?.kind;
      const r = kind ? BUILDINGS[kind].radius : undefined;
      if (r) {
        const c = this.worldToScreen(state.selectedTile.x + 0.5, state.selectedTile.y + 0.5);
        ctx.beginPath();
        ctx.arc(c.x, c.y, (r + 0.5) * ts, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (const tile of state.tiles) {
      const { x: sx, y: sy } = this.worldToScreen(tile.x, tile.y);
      if (sx + ts < 0 || sy + ts < 0 || sx > w || sy > h) continue;

      if (tile.terrain === 'locked') {
        ctx.fillStyle = '#0a1612';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.strokeRect(sx, sy, ts, ts);
        continue;
      }

      if (tile.terrain === 'water') {
        ctx.fillStyle = '#1a4a5c';
      } else if (tile.terrain === 'dirt') {
        ctx.fillStyle = '#2a4634';
      } else {
        ctx.fillStyle = (tile.x + tile.y) % 2 === 0 ? '#1f5c43' : '#1a533c';
      }
      ctx.fillRect(sx, sy, ts, ts);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeRect(sx, sy, ts, ts);

      if (tile.building) {
        this.drawBuilding(state, tile.x, tile.y, tile.building.kind, sx, sy, ts);
      }

      // Hover
      if (this.hover && this.hover.x === tile.x && this.hover.y === tile.y) {
        ctx.strokeStyle = 'rgba(244, 226, 124, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, ts - 2, ts - 2);
        ctx.lineWidth = 1;
      }

      // Selected
      if (
        state.selectedTile &&
        state.selectedTile.x === tile.x &&
        state.selectedTile.y === tile.y
      ) {
        ctx.strokeStyle = '#3ecf8e';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(sx + 1, sy + 1, ts - 2, ts - 2);
        ctx.lineWidth = 1;
      }
    }

    // Ghost placement
    if (state.selectedBuild && this.hover) {
      const { x: sx, y: sy } = this.worldToScreen(this.hover.x, this.hover.y);
      ctx.globalAlpha = 0.45;
      this.drawBuilding(state, this.hover.x, this.hover.y, state.selectedBuild, sx, sy, ts, true);
      ctx.globalAlpha = 1;
    }
  }

  private drawBuilding(
    state: GameState,
    tx: number,
    ty: number,
    kind: BuildingKind,
    sx: number,
    sy: number,
    ts: number,
    ghost = false,
  ) {
    const ctx = this.ctx;
    const def = BUILDINGS[kind];
    const tile = tileAt(state, tx, ty);
    const b = tile?.building;

    if (kind === 'road') {
      ctx.fillStyle = ghost ? '#777' : '#4a4a4a';
      ctx.fillRect(sx + ts * 0.1, sy + ts * 0.1, ts * 0.8, ts * 0.8);
      ctx.fillStyle = '#c9c9c9';
      ctx.fillRect(sx + ts * 0.45, sy + ts * 0.15, ts * 0.1, ts * 0.7);
      return;
    }

    // Base pad
    ctx.fillStyle = def.color;
    roundRect(ctx, sx + ts * 0.12, sy + ts * 0.18, ts * 0.76, ts * 0.7, ts * 0.1);
    ctx.fill();

    // Decay cracks
    if (b && b.decay > 20 && !ghost) {
      ctx.strokeStyle = `rgba(40,20,10,${Math.min(0.7, b.decay / 100)})`;
      ctx.beginPath();
      ctx.moveTo(sx + ts * 0.25, sy + ts * 0.3);
      ctx.lineTo(sx + ts * 0.45, sy + ts * 0.7);
      ctx.moveTo(sx + ts * 0.6, sy + ts * 0.25);
      ctx.lineTo(sx + ts * 0.7, sy + ts * 0.75);
      ctx.stroke();
    }

    // Emoji / label
    ctx.font = `${Math.floor(ts * 0.42)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, sx + ts / 2, sy + ts * 0.48);

    if (b && b.kind === 'house' && !ghost) {
      ctx.font = `bold ${Math.floor(ts * 0.22)}px Outfit, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(`L${b.level}`, sx + ts / 2, sy + ts * 0.78);
    }

    // Production ring / ready pulse
    if (b && BUILDINGS[b.kind].produce && !ghost) {
      const p = productionProgress(state, tx, ty);
      if (b.readyAmount > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
        ctx.beginPath();
        ctx.arc(sx + ts * 0.82, sy + ts * 0.22, ts * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 226, 124, ${0.6 + pulse * 0.4})`;
        ctx.fill();
      } else if (p > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#3ecf8e';
        ctx.lineWidth = 3;
        ctx.arc(sx + ts * 0.82, sy + ts * 0.22, ts * 0.12, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }
}

function roundRect(
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
