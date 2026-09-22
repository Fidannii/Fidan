import { DEFS } from '../core/catalog';
import type { Cell, Game } from '../core/types';
import { cell, prog } from '../core/sim';
import { landColor, landValueAt, serviceQualityAt } from '../core/systems';
import { congestionAt, trafficColor } from '../core/traffic';
import { isRoad } from '../core/world';
import { drawBuildingSprite, isoDiamond } from './sprites';
import { spawnFloat, tickFloats, type FloatLabel } from './fx';

const TW = 58;
const TH = 29;

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

interface Citizen {
  x: number;
  y: number;
  tx: number;
  ty: number;
  hue: string;
  speed: number;
}

export class View {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camX = 0;
  camY = 0;
  scale = 1.5;
  hover: { x: number; y: number } | null = null;
  particles: Particle[] = [];
  floats: FloatLabel[] = [];
  citizens: Citizen[] = [];
  time = 0;
  /** Phase 1–3 overlays */
  overlay: null | 'land' | 'traffic' | 'power' | 'health' = null;
  /** 0 day → 1 night cycle */
  dayPhase = 0.25;
  vehicles: Array<{ x: number; y: number; tx: number; ty: number; bus: boolean; speed: number }> = [];
  private citizenInit = false;
  private vehicleInit = false;
  private lastRegion: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const p = this.canvas.parentElement!;
    const dpr = Math.min(devicePixelRatio || 1, 2.5);
    const w = p.clientWidth;
    const h = p.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  toScreen(wx: number, wy: number) {
    const s = this.scale;
    return {
      x: (wx - wy) * (TW / 2) * s + this.camX,
      y: (wx + wy) * (TH / 2) * s + this.camY,
    };
  }

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
    const s = this.scale;
    const cx = (mid - mid) * (TW / 2) * s;
    const cy = (mid + mid) * (TH / 2) * s;
    this.camX = w / 2 - cx;
    this.camY = h * 0.4 - cy;
  }

  spawnBurst(wx: number, wy: number, color: string, n = 12) {
    const p = this.toScreen(wx + 0.5, wy + 0.5);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 1.8;
      this.particles.push({
        x: p.x,
        y: p.y - 12,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        life: 1,
        max: 0.7 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 3.5,
      });
    }
  }

  floatAt(wx: number, wy: number, text: string, color?: string) {
    const p = this.toScreen(wx + 0.5, wy + 0.5);
    spawnFloat(this.floats, p.x, p.y - 28 * this.scale, text, color);
  }

  private ensureCitizens(g: Game) {
    if (this.lastRegion !== g.region) {
      this.lastRegion = g.region;
      this.citizenInit = false;
      this.vehicleInit = false;
      this.citizens = [];
      this.vehicles = [];
    }
    if (this.citizenInit) return;
    this.citizenInit = true;
    const roads = g.cells.filter((c) => c.b && isRoad(c.b.id));
    const hues = ['#ff8fab', '#7ad4ff', '#f0d56a', '#c4b5fd', '#fb923c', '#86efac'];
    const n = Math.min(18, Math.max(4, roads.length));
    for (let i = 0; i < n; i++) {
      const r = roads[i % Math.max(1, roads.length)];
      if (!r) break;
      this.citizens.push({
        x: r.x + 0.5,
        y: r.y + 0.5,
        tx: r.x + 0.5,
        ty: r.y + 0.5,
        hue: hues[i % hues.length],
        speed: 0.004 + Math.random() * 0.006,
      });
    }
  }

  private ensureVehicles(g: Game) {
    if (this.vehicleInit) return;
    this.vehicleInit = true;
    const roads = g.cells.filter((c) => c.b && isRoad(c.b.id));
    const cong = g.traffic?.congestion ?? 30;
    const count = Math.min(20, Math.max(3, Math.floor(roads.length * 0.35 + cong / 15)));
    for (let i = 0; i < count; i++) {
      const r = roads[i % Math.max(1, roads.length)];
      if (!r) break;
      this.vehicles.push({
        x: r.x + 0.5,
        y: r.y + 0.5,
        tx: r.x + 0.5,
        ty: r.y + 0.5,
        bus: i % 7 === 0,
        speed: (i % 7 === 0 ? 0.006 : 0.01) * (1 - Math.min(0.6, cong / 150)),
      });
    }
  }

  private sky(g: Game, w: number, h: number) {
    this.dayPhase = (Math.sin(this.time / 45000) + 1) / 2;
    const night = this.dayPhase;
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (g.region === 'desert') {
      grad.addColorStop(0, '#140e08');
      grad.addColorStop(0.35, '#3a2410');
      grad.addColorStop(0.7, '#6b4520');
      grad.addColorStop(1, '#8a5a28');
    } else if (g.region === 'snow') {
      grad.addColorStop(0, '#060c18');
      grad.addColorStop(0.4, '#152838');
      grad.addColorStop(1, '#3a5168');
    } else if (g.region === 'coast') {
      grad.addColorStop(0, '#041018');
      grad.addColorStop(0.4, '#0c2c3c');
      grad.addColorStop(1, '#1a6870');
    } else {
      grad.addColorStop(0, '#040c14');
      grad.addColorStop(0.35, '#0a2230');
      grad.addColorStop(0.7, '#0f3d32');
      grad.addColorStop(1, '#1a6a4a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `rgba(255,220,160,${0.08 * (1 - night)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `rgba(5,10,30,${0.35 * night})`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 48; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 89.3) % (h * 0.45);
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(this.time / 800 + i));
      ctx.globalAlpha = tw * (0.2 + night * 0.55);
      ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
    const gx = w * (0.2 + 0.6 * (1 - night));
    const gy = h * (0.12 + 0.08 * night);
    const sun = ctx.createRadialGradient(gx, gy, 2, gx, gy, 140);
    if (night > 0.55) {
      sun.addColorStop(0, 'rgba(220,230,255,0.45)');
      sun.addColorStop(1, 'rgba(100,120,180,0)');
    } else if (g.region === 'desert') {
      sun.addColorStop(0, 'rgba(255,210,90,0.7)');
      sun.addColorStop(0.35, 'rgba(255,150,50,0.25)');
      sun.addColorStop(1, 'rgba(255,120,40,0)');
    } else {
      sun.addColorStop(0, 'rgba(140,240,200,0.35)');
      sun.addColorStop(0.4, 'rgba(80,180,140,0.12)');
      sun.addColorStop(1, 'rgba(40,140,100,0)');
    }
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const cx = ((this.time * 0.012 * (0.25 + i * 0.08) + i * 240) % (w + 260)) - 120;
      const cy = 28 + i * 26;
      ctx.globalAlpha = 0.04 + (1 - night) * 0.05;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70 + i * 8, 16 + i, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 36, cy + 3, 44, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 28, cy + 2, 36, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private terrainColors(g: Game, c: Cell): { top: string; edge: string } {
    if (c.terrain === 'water') {
      const wave = 0.1 * Math.sin(this.time / 380 + c.x * 0.8 + c.y * 0.55);
      return {
        top: `rgba(${28 + wave * 50},${100 + wave * 40},${130 + wave * 50},0.96)`,
        edge: '#0a3040',
      };
    }
    if (c.terrain === 'sand') {
      const alt = (c.x + c.y) % 2 === 0;
      return { top: alt ? '#dfc08e' : '#d0ad72', edge: '#9a7840' };
    }
    if (c.terrain === 'snow') {
      const alt = (c.x + c.y) % 2 === 0;
      return { top: alt ? '#f0f6fb' : '#dce8f2', edge: '#8fa6ba' };
    }
    if (c.terrain === 'void') return { top: '#070c0a', edge: '#030605' };
    const alt = (c.x + c.y) % 2 === 0;
    if (g.region === 'coast') {
      return { top: alt ? '#228a64' : '#1c7554', edge: '#0c3a2c' };
    }
    return { top: alt ? '#2f9a64' : '#268555', edge: '#124a30' };
  }

  private drawTile(g: Game, c: Cell) {
    const ctx = this.ctx;
    const s = this.scale;
    const { x: cx, y: cy } = this.toScreen(c.x, c.y);
    const hw = (TW / 2) * s;
    const hh = (TH / 2) * s;
    const cols = this.terrainColors(g, c);
    const depth = 6 * s;

    if (c.terrain === 'void') {
      isoDiamond(ctx, cx, cy, hw, hh, 'rgba(6,12,10,0.45)');
      return;
    }

    // extruded sides
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx, cy + hh + depth);
    ctx.lineTo(cx - hw, cy + depth);
    ctx.closePath();
    ctx.fillStyle = cols.edge;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx, cy + hh + depth);
    ctx.lineTo(cx + hw, cy + depth);
    ctx.closePath();
    ctx.fillStyle = cols.edge;
    ctx.globalAlpha = 0.82;
    ctx.fill();
    ctx.globalAlpha = 1;

    isoDiamond(ctx, cx, cy, hw, hh, cols.top, 'rgba(255,255,255,0.05)');

    if (this.overlay === 'land') {
      const lv = landValueAt(g, c.x, c.y);
      isoDiamond(ctx, cx, cy, hw * 0.92, hh * 0.92, landColor(lv));
    } else if (this.overlay === 'traffic' && c.b && isRoad(c.b.id)) {
      isoDiamond(ctx, cx, cy, hw * 0.92, hh * 0.92, trafficColor(congestionAt(g, c.x, c.y)));
    } else if (this.overlay === 'power') {
      const q = serviceQualityAt(g, c.x, c.y, ['power', 'solar']);
      if (q.covered) isoDiamond(ctx, cx, cy, hw * 0.9, hh * 0.9, `rgba(240,210,90,${0.15 + q.quality * 0.35})`);
    } else if (this.overlay === 'health') {
      const q = serviceQualityAt(g, c.x, c.y, ['hospital']);
      if (q.covered) isoDiamond(ctx, cx, cy, hw * 0.9, hh * 0.9, `rgba(255,100,120,${0.12 + q.quality * 0.35})`);
    }
    // night building lights
    if (c.b && this.dayPhase > 0.55 && c.b.id !== 'road' && c.b.id !== 'highway') {
      ctx.fillStyle = `rgba(255,220,140,${0.15 + 0.2 * this.dayPhase})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 8 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // construction crane hint while producing
    if (c.b?.jobAt && c.b.ready <= 0 && DEFS[c.b.id].produce) {
      ctx.strokeStyle = 'rgba(240,213,106,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4 * s);
      ctx.lineTo(cx + 8 * s, cy - 16 * s);
      ctx.stroke();
    }

    if (c.terrain === 'water') {
      const shimmer = 0.12 + 0.12 * Math.sin(this.time / 280 + c.x * 1.2 + c.y);
      ctx.fillStyle = `rgba(190,240,255,${shimmer})`;
      ctx.beginPath();
      ctx.ellipse(cx + 5 * s, cy - 2 * s, 7 * s, 2.2 * s, 0.35, 0, Math.PI * 2);
      ctx.fill();
      // reflection hint
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + shimmer * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 8 * s, cy);
      ctx.lineTo(cx + 8 * s, cy);
      ctx.stroke();
    }

    if (c.terrain === 'grass' && !c.b) {
      const seed = (c.x * 13 + c.y * 7) % 11;
      if (seed === 0 || seed === 4) {
        ctx.strokeStyle = 'rgba(190,255,210,0.3)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 2.5 * s, cy - 6 * s);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 2.5 * s, cy - 5 * s);
        if (seed === 0) {
          ctx.moveTo(cx + 1 * s, cy);
          ctx.lineTo(cx + 4 * s, cy - 4 * s);
        }
        ctx.stroke();
      }
      if (seed === 2) {
        // flower
        ctx.fillStyle = 'rgba(255,180,200,0.55)';
        ctx.beginPath();
        ctx.arc(cx + 3 * s, cy - 3 * s, 1.8 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private tickCitizens(g: Game) {
    this.ensureCitizens(g);
    this.ensureVehicles(g);
    const roads = g.cells.filter((c) => c.b && isRoad(c.b.id));
    if (!roads.length) return;
    for (const cit of this.citizens) {
      const dx = cit.tx - cit.x;
      const dy = cit.ty - cit.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        const n = roads[Math.floor(Math.random() * roads.length)];
        cit.tx = n.x + 0.35 + Math.random() * 0.3;
        cit.ty = n.y + 0.35 + Math.random() * 0.3;
      } else {
        cit.x += (dx / dist) * cit.speed;
        cit.y += (dy / dist) * cit.speed;
      }
    }
    for (const v of this.vehicles) {
      const dx = v.tx - v.x;
      const dy = v.ty - v.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.08) {
        const n = roads[Math.floor(Math.random() * roads.length)];
        v.tx = n.x + 0.4 + Math.random() * 0.2;
        v.ty = n.y + 0.4 + Math.random() * 0.2;
      } else {
        v.x += (dx / dist) * v.speed;
        v.y += (dy / dist) * v.speed;
      }
    }
  }

  private drawCitizens() {
    const ctx = this.ctx;
    const s = this.scale;
    for (const cit of this.citizens) {
      const p = this.toScreen(cit.x, cit.y);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1 * s, 2.2 * s, 1.1 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cit.hue;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 3 * s, 2.4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(p.x - 1.4 * s, p.y - 1.5 * s, 2.8 * s, 4 * s);
    }
    for (const v of this.vehicles) {
      const p = this.toScreen(v.x, v.y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1 * s, (v.bus ? 5 : 3.2) * s, 1.4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = v.bus ? '#3ecf8e' : '#e8eef2';
      ctx.fillRect(p.x - (v.bus ? 5 : 3) * s, p.y - 2.5 * s, (v.bus ? 10 : 6) * s, 3.2 * s);
      ctx.fillStyle = '#7ad4ff';
      ctx.fillRect(p.x - (v.bus ? 3 : 1.5) * s, p.y - 2.2 * s, (v.bus ? 3 : 2) * s, 1.6 * s);
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
      ctx.fillStyle = `rgba(200,40,20,${0.1 + 0.05 * Math.sin(this.time / 110)})`;
      ctx.fillRect(0, 0, w, h);
    }

    const tiles = g.cells.slice().sort((a, b) => a.x + a.y - (b.x + b.y));

    // soft fog under island
    for (const c of tiles) {
      if (c.terrain === 'void') continue;
      const nVoid =
        !g.cells.find((t) => t.x === c.x + 1 && t.y === c.y + 1 && t.terrain !== 'void');
      if (!nVoid) continue;
      const p = this.toScreen(c.x, c.y);
      if (p.x < -100 || p.x > w + 100) continue;
      const mist = ctx.createRadialGradient(p.x, p.y + 28 * this.scale, 4, p.x, p.y + 28 * this.scale, 50 * this.scale);
      mist.addColorStop(0, 'rgba(180,220,210,0.08)');
      mist.addColorStop(1, 'rgba(180,220,210,0)');
      ctx.fillStyle = mist;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 28 * this.scale, 50 * this.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // cliffs
    for (const c of tiles) {
      if (c.terrain === 'void') continue;
      const p = this.toScreen(c.x, c.y);
      if (p.x < -90 || p.y < -90 || p.x > w + 90 || p.y > h + 140) continue;
      const neighbors = [
        [1, 0],
        [0, 1],
      ];
      const s = this.scale;
      const hw = (TW / 2) * s;
      const hh = (TH / 2) * s;
      const depth = 16 * s;
      for (const [dx, dy] of neighbors) {
        const n = g.cells.find((t) => t.x === c.x + dx && t.y === c.y + dy);
        if (n && n.terrain !== 'void') continue;
        ctx.beginPath();
        if (dx === 1 && dy === 0) {
          ctx.moveTo(p.x + hw, p.y);
          ctx.lineTo(p.x, p.y + hh);
          ctx.lineTo(p.x, p.y + hh + depth);
          ctx.lineTo(p.x + hw, p.y + depth);
        } else {
          ctx.moveTo(p.x - hw, p.y);
          ctx.lineTo(p.x, p.y + hh);
          ctx.lineTo(p.x, p.y + hh + depth);
          ctx.lineTo(p.x - hw, p.y + depth);
        }
        ctx.closePath();
        const cliff = ctx.createLinearGradient(p.x, p.y, p.x, p.y + depth);
        if (g.region === 'desert') {
          cliff.addColorStop(0, '#8a6a40');
          cliff.addColorStop(0.5, '#5a4028');
          cliff.addColorStop(1, '#1a1208');
        } else if (g.region === 'snow') {
          cliff.addColorStop(0, '#8aa0b4');
          cliff.addColorStop(0.5, '#4a5c6c');
          cliff.addColorStop(1, '#121820');
        } else {
          cliff.addColorStop(0, '#4a7050');
          cliff.addColorStop(0.45, '#2a4030');
          cliff.addColorStop(1, '#0c1410');
        }
        ctx.fillStyle = cliff;
        ctx.fill();
        // rock striations
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const yy = p.y + (depth * i) / 4;
          ctx.beginPath();
          if (dx === 1) {
            ctx.moveTo(p.x + hw * (1 - i / 5), yy);
            ctx.lineTo(p.x + hw * 0.15, yy);
          } else {
            ctx.moveTo(p.x - hw * (1 - i / 5), yy);
            ctx.lineTo(p.x - hw * 0.15, yy);
          }
          ctx.stroke();
        }
      }
    }

    for (const c of tiles) {
      const p = this.toScreen(c.x, c.y);
      if (p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 80) continue;
      if (c.terrain === 'void') continue;
      this.drawTile(g, c);
    }

    // service radius
    if (g.focus) {
      const f = cell(g, g.focus.x, g.focus.y);
      const r = f?.b ? DEFS[f.b.id].radius : undefined;
      if (r && f?.b) {
        const rad = r + f.b.level - 1;
        const c = this.toScreen(g.focus.x, g.focus.y);
        ctx.beginPath();
        ctx.ellipse(
          c.x,
          c.y,
          rad * (TW / 2) * this.scale * 1.15,
          rad * (TH / 2) * this.scale * 1.15,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = 'rgba(100,210,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,220,255,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    for (const c of tiles) {
      if (!c.b) continue;
      const p = this.toScreen(c.x, c.y);
      if (p.x < -100 || p.y < -120 || p.x > w + 100 || p.y > h + 100) continue;
      drawBuildingSprite(ctx, c.b.id, p.x, p.y, this.scale, c.b.level, this.time, c.b.wear);

      if (DEFS[c.b.id].produce) {
        const pr = prog(g, c.x, c.y);
        if (c.b.ready > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(this.time / 160);
          const by = p.y - 38 * this.scale - pulse * 3 * this.scale;
          ctx.beginPath();
          ctx.arc(p.x, by, 8 * this.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,220,90,${0.6 + pulse * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = '#fff8d0';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#042218';
          ctx.font = `800 ${Math.max(10, 11 * this.scale)}px Outfit, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('¢', p.x, by + 0.5);
          if (Math.random() < 0.06) this.spawnBurst(c.x, c.y, '#ffe566', 2);
        } else if (pr > 0) {
          ctx.beginPath();
          ctx.strokeStyle = '#3ecf8e';
          ctx.lineWidth = 3.2;
          ctx.arc(p.x, p.y - 36 * this.scale, 7.5 * this.scale, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.arc(p.x, p.y - 36 * this.scale, 7.5 * this.scale, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // happiness sparkle on high-level houses
      if (c.b.id === 'house' && c.b.level >= 3 && Math.random() < 0.02) {
        this.spawnBurst(c.x, c.y, '#7ad4ff', 1);
      }
    }

    this.tickCitizens(g);
    this.drawCitizens();

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
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.fillStyle = color === '#f4e27c' ? 'rgba(244,226,124,0.14)' : 'rgba(62,207,142,0.14)';
      ctx.fill();
    };

    if (this.hover) mark(this.hover.x, this.hover.y, '#f4e27c');
    if (g.focus) mark(g.focus.x, g.focus.y, '#3ecf8e');

    if (g.selected && this.hover) {
      const p = this.toScreen(this.hover.x, this.hover.y);
      ctx.globalAlpha = 0.42;
      drawBuildingSprite(ctx, g.selected, p.x, p.y, this.scale, 1, this.time, 0);
      ctx.globalAlpha = 1;
    }

    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.045;
      pt.life -= 0.018;
      if (pt.life <= 0) return false;
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * this.scale * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });

    this.floats = tickFloats(ctx, this.floats, this.scale);

    // vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.18, w / 2, h / 2, h * 0.88);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    if (g.region === 'snow' || g.region === 'desert') {
      ctx.fillStyle = g.region === 'snow' ? 'rgba(255,255,255,0.75)' : 'rgba(230,200,130,0.5)';
      for (let i = 0; i < 55; i++) {
        const px = (i * 97 + this.time * (g.region === 'snow' ? 0.045 : 0.09)) % w;
        const py = (i * 53 + this.time * 0.065) % h;
        ctx.fillRect(px, py, g.region === 'snow' ? 2.2 : 1.6, g.region === 'snow' ? 2.2 : 1.2);
      }
    }
  }
}
