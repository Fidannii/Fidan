import type { BuildId } from '../core/types';

export type DrawCtx = CanvasRenderingContext2D;

function shade(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (num & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

/** Isometric diamond footprint */
export function isoDiamond(
  ctx: DrawCtx,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  fill: string,
  stroke?: string,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Extruded iso box with rim light + edge AA */
export function isoBox(
  ctx: DrawCtx,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  h: number,
  top: string,
  left: string,
  right: string,
) {
  // left face
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - h);
  ctx.lineTo(cx, cy + hh - h);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  const lg = ctx.createLinearGradient(cx - hw, cy, cx, cy + hh);
  lg.addColorStop(0, shade(left, 18));
  lg.addColorStop(1, shade(left, -22));
  ctx.fillStyle = lg;
  ctx.fill();

  // right face
  ctx.beginPath();
  ctx.moveTo(cx + hw, cy - h);
  ctx.lineTo(cx, cy + hh - h);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx + hw, cy);
  ctx.closePath();
  const rg = ctx.createLinearGradient(cx, cy, cx + hw, cy + hh);
  rg.addColorStop(0, shade(right, 8));
  rg.addColorStop(1, shade(right, -28));
  ctx.fillStyle = rg;
  ctx.fill();

  // top
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh - h);
  ctx.lineTo(cx + hw, cy - h);
  ctx.lineTo(cx, cy + hh - h);
  ctx.lineTo(cx - hw, cy - h);
  ctx.closePath();
  const tg = ctx.createLinearGradient(cx - hw, cy - h - hh, cx + hw, cy - h + hh);
  tg.addColorStop(0, shade(top, 28));
  tg.addColorStop(0.45, top);
  tg.addColorStop(1, shade(top, -18));
  ctx.fillStyle = tg;
  ctx.fill();

  // rim highlight on top-left edge
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - h);
  ctx.lineTo(cx, cy - hh - h);
  ctx.lineTo(cx + hw, cy - h);
  ctx.stroke();
}

function windowRow(
  ctx: DrawCtx,
  x: number,
  y: number,
  w: number,
  rows: number,
  cols: number,
  lit: boolean,
  t = 0,
) {
  const gw = w / (cols + 1);
  const gh = 3.5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = lit && (r + c + Math.floor(t / 900)) % 4 !== 0;
      ctx.fillStyle = on ? 'rgba(255,236,160,0.92)' : 'rgba(18,36,52,0.72)';
      const wx = x + gw * (c + 0.35);
      const wy = y + r * (gh + 2.2);
      ctx.fillRect(wx, wy, Math.max(2, gw * 0.42), gh);
      if (on) {
        ctx.fillStyle = 'rgba(255,220,120,0.2)';
        ctx.fillRect(wx - 1, wy - 1, Math.max(2, gw * 0.42) + 2, gh + 2);
      }
    }
  }
}

function tree(ctx: DrawCtx, x: number, y: number, s: number, hue = '#1b4332') {
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(x - 1.2 * s, y, 2.4 * s, 7 * s);
  for (const [oy, r, col] of [
    [-2, 8, hue],
    [-10, 6.5, shade(hue, 18)],
    [-17, 4.5, shade(hue, 32)],
  ] as const) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y + oy * s - r * 0.55 * s);
    ctx.lineTo(x + r * s, y + oy * s + 6 * s);
    ctx.lineTo(x - r * s, y + oy * s + 6 * s);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawBuildingSprite(
  ctx: DrawCtx,
  id: BuildId,
  cx: number,
  cy: number,
  s: number,
  level: number,
  t: number,
  wear: number,
) {
  const hw = 18 * s;
  const hh = 10 * s;
  const shadowA = 0.3 + wear / 380;

  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${shadowA})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3 * s, hw * 0.95, hh * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const H = (12 + level * 4) * s;
  const pulse = 0.5 + 0.5 * Math.sin(t / 450);

  switch (id) {
    case 'road':
    case 'highway': {
      const asphalt = id === 'highway' ? '#2a2e34' : '#555a62';
      isoDiamond(ctx, cx, cy, hw, hh, asphalt, 'rgba(0,0,0,0.2)');
      // curb
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      isoDiamond(ctx, cx, cy, hw * 0.92, hh * 0.92, 'transparent', 'rgba(255,255,255,0.08)');
      ctx.strokeStyle = id === 'highway' ? '#f0d56a' : 'rgba(245,245,245,0.6)';
      ctx.lineWidth = Math.max(1, 1.6 * s);
      ctx.setLineDash(id === 'highway' ? [] : [5 * s, 5 * s]);
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.42, cy);
      ctx.lineTo(cx + hw * 0.42, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      if (id === 'highway') {
        ctx.globalAlpha = 0.35 + pulse * 0.25;
        ctx.strokeStyle = '#ffe566';
        ctx.beginPath();
        ctx.moveTo(cx, cy - hh * 0.38);
        ctx.lineTo(cx, cy + hh * 0.38);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'house': {
      const h = (13 + level * 7.5) * s;
      const wall = level >= 3 ? '#e8d0b8' : '#f0c49a';
      isoBox(ctx, cx, cy, hw * 0.8, hh * 0.78, h, wall, '#8f5a32', '#b87742');
      // roof
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh * 0.78 - h - 11 * s);
      ctx.lineTo(cx + hw * 0.95, cy - h + 2 * s);
      ctx.lineTo(cx, cy + hh * 0.12 - h);
      ctx.lineTo(cx - hw * 0.95, cy - h + 2 * s);
      ctx.closePath();
      const roof = ctx.createLinearGradient(cx - hw, cy - h, cx + hw, cy - h);
      roof.addColorStop(0, level >= 3 ? '#4a2030' : '#6e3218');
      roof.addColorStop(0.5, level >= 3 ? '#8b3d52' : '#b04a22');
      roof.addColorStop(1, level >= 3 ? '#5c2a3a' : '#7a3b1e');
      ctx.fillStyle = roof;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,160,0.15)';
      ctx.stroke();
      // chimney + smoke
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(cx + 7 * s, cy - h - 18 * s, 4.5 * s, 12 * s);
      ctx.fillStyle = `rgba(200,205,215,${0.2 + 0.2 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx + 9 * s, cy - h - 22 * s - pulse * 3 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      windowRow(ctx, cx - 8 * s, cy - h + 4 * s, 16 * s, Math.min(5, level + 1), 2, true, t);
      // door + porch
      ctx.fillStyle = '#3a2210';
      ctx.fillRect(cx - 3.5 * s, cy - 1 * s, 7 * s, 9 * s);
      ctx.fillStyle = '#d4a574';
      ctx.fillRect(cx - 1 * s, cy + 2 * s, 1.5 * s, 2 * s);
      if (level >= 2) {
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.arc(cx - 10 * s, cy - 2 * s, 4 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      if (level >= 4) {
        // tower / skyscraper top
        ctx.fillStyle = '#cfd6de';
        ctx.fillRect(cx - 4 * s, cy - h - 34 * s, 8 * s, 28 * s);
        windowRow(ctx, cx - 3 * s, cy - h - 30 * s, 6 * s, 4, 1, true, t);
        ctx.fillStyle = `rgba(255,220,120,${0.3 + 0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy - h - 38 * s, 9 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'woodcutter': {
      isoBox(ctx, cx, cy, hw * 0.48, hh * 0.48, 10 * s, '#5cbf82', '#2d6a4f', '#3d8b5f');
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = shade('#6b4226', i * 8);
        ctx.beginPath();
        ctx.ellipse(cx - 11 * s + i * 3.2 * s, cy + 3 * s, 5.2 * s, 2.6 * s, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      tree(ctx, cx + 11 * s, cy + 2 * s, s);
      tree(ctx, cx + 4 * s, cy + 4 * s, s * 0.75, '#245c40');
      break;
    }
    case 'power': {
      isoBox(ctx, cx, cy, hw * 0.52, hh * 0.48, 10 * s, '#ffe066', '#b89220', '#d4a82e');
      for (const ox of [-9, 9]) {
        const g = ctx.createLinearGradient(cx + ox * s, cy, cx + ox * s, cy - 32 * s);
        g.addColorStop(0, '#eef2f5');
        g.addColorStop(1, '#b8c4cc');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx + ox * s - 5.5 * s, cy);
        ctx.quadraticCurveTo(cx + ox * s - 8 * s, cy - 18 * s, cx + ox * s - 3.2 * s, cy - 32 * s);
        ctx.lineTo(cx + ox * s + 3.2 * s, cy - 32 * s);
        ctx.quadraticCurveTo(cx + ox * s + 8 * s, cy - 18 * s, cx + ox * s + 5.5 * s, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(220,225,235,${0.22 + 0.2 * Math.sin(t / 380 + ox)})`;
        ctx.beginPath();
        ctx.ellipse(
          cx + ox * s,
          cy - 38 * s - Math.sin(t / 420 + ox) * 4 * s,
          6 * s,
          3.5 * s,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      // spark
      ctx.fillStyle = `rgba(255,240,120,${0.35 + 0.35 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 8 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'water': {
      isoBox(ctx, cx, cy, hw * 0.34, hh * 0.3, 9 * s, '#9ed4f0', '#1a6288', '#3a96bf');
      const tg = ctx.createLinearGradient(cx - 12 * s, cy - 30 * s, cx + 12 * s, cy - 6 * s);
      tg.addColorStop(0, '#e0f4ff');
      tg.addColorStop(0.45, '#5eb4e8');
      tg.addColorStop(1, '#1a6288');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 22 * s, 12 * s, 8.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(cx - 4 * s, cy - 24 * s, 4.5 * s, 2.8 * s, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2f4f5e';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 7 * s, cy - 14 * s);
      ctx.lineTo(cx - 9 * s, cy + 3 * s);
      ctx.moveTo(cx + 7 * s, cy - 14 * s);
      ctx.lineTo(cx + 9 * s, cy + 3 * s);
      ctx.stroke();
      break;
    }
    case 'sawmill': {
      isoBox(ctx, cx, cy, hw * 0.72, hh * 0.66, 13 * s, '#d2b48c', '#7a5a32', '#9a7440');
      // spinning blade
      ctx.save();
      ctx.translate(cx + 5 * s, cy - 8 * s);
      ctx.rotate(t / 180);
      ctx.strokeStyle = '#4a3828';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 7 * s, 0, Math.PI * 2);
      ctx.moveTo(-7 * s, 0);
      ctx.lineTo(7 * s, 0);
      ctx.moveTo(0, -7 * s);
      ctx.lineTo(0, 7 * s);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(cx - 12 * s, cy + 1 * s, 10 * s, 3 * s);
      break;
    }
    case 'mine': {
      isoBox(ctx, cx, cy, hw * 0.68, hh * 0.62, 9 * s, '#9aa1aa', '#4c5360', '#6a727e');
      ctx.fillStyle = '#1a1e24';
      ctx.beginPath();
      ctx.ellipse(cx - 5 * s, cy + 3 * s, 7 * s, 3.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // cart
      ctx.fillStyle = '#8b5e34';
      ctx.fillRect(cx + 4 * s, cy - 2 * s, 9 * s, 5 * s);
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cx + 6 * s, cy + 4 * s, 2 * s, 0, Math.PI * 2);
      ctx.arc(cx + 11 * s, cy + 4 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chem':
    case 'plastics': {
      const top = id === 'chem' ? '#b57bff' : '#9b4ddb';
      isoBox(ctx, cx, cy, hw * 0.62, hh * 0.56, 15 * s, top, '#4a1580', '#6a2a9a');
      ctx.fillStyle = '#777';
      ctx.fillRect(cx + 7 * s, cy - 32 * s, 3.5 * s, 18 * s);
      ctx.fillStyle = `rgba(210,215,230,${0.3 + 0.25 * Math.sin(t / 380)})`;
      ctx.beginPath();
      ctx.arc(cx + 9 * s, cy - 36 * s - Math.sin(t / 280) * 5 * s, 5.5 * s, 0, Math.PI * 2);
      ctx.fill();
      // tanks
      ctx.fillStyle = id === 'chem' ? '#7b2cbf' : '#5a189a';
      ctx.beginPath();
      ctx.ellipse(cx - 8 * s, cy - 4 * s, 5 * s, 7 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'glassworks': {
      isoBox(ctx, cx, cy, hw * 0.66, hh * 0.6, 13 * s, '#c8f0fa', '#3f98b0', '#62b8cc');
      ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.25 * pulse})`;
      ctx.fillRect(cx - 5 * s, cy - 16 * s, 10 * s, 7 * s);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.strokeRect(cx - 5 * s, cy - 16 * s, 10 * s, 7 * s);
      break;
    }
    case 'workshop': {
      isoBox(ctx, cx, cy, hw * 0.66, hh * 0.6, 12 * s, '#f6b27a', '#b04e22', '#d46a32');
      ctx.fillStyle = '#5c4030';
      ctx.fillRect(cx - 6 * s, cy - 2 * s, 4 * s, 6 * s);
      ctx.fillStyle = `rgba(255,180,80,${0.35 + 0.3 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx + 6 * s, cy - 10 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'textile': {
      isoBox(ctx, cx, cy, hw * 0.66, hh * 0.6, 12 * s, '#ff4d9a', '#8e1250', '#c41e72');
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5 * s;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 8 * s, cy - 14 * s + i * 4 * s);
        ctx.lineTo(cx + 8 * s, cy - 14 * s + i * 4 * s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'furniture': {
      isoBox(ctx, cx, cy, hw * 0.72, hh * 0.66, 14 * s, '#e0b07a', '#7a4e28', '#9a6434');
      ctx.fillStyle = '#5c4030';
      ctx.fillRect(cx - 5 * s, cy - 8 * s, 10 * s, 3 * s);
      ctx.fillRect(cx - 4 * s, cy - 5 * s, 2 * s, 8 * s);
      ctx.fillRect(cx + 2 * s, cy - 5 * s, 2 * s, 8 * s);
      break;
    }
    case 'solar': {
      isoDiamond(ctx, cx, cy, hw, hh, '#163848');
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 8 * s, cy - 7 * s);
        ctx.lineTo(cx + 11 * s + i * 8 * s, cy);
        ctx.lineTo(cx + i * 8 * s, cy + 7 * s);
        ctx.lineTo(cx - 11 * s + i * 8 * s, cy);
        ctx.closePath();
        const pg = ctx.createLinearGradient(cx - 10 * s, cy, cx + 10 * s, cy);
        pg.addColorStop(0, '#1a6a8a');
        pg.addColorStop(0.5, '#4cc9f0');
        pg.addColorStop(1, '#2892b8');
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,255,210,${0.35 + 0.3 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx + 5 * s, cy - 5 * s, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sewage':
    case 'waste': {
      isoBox(
        ctx,
        cx,
        cy,
        hw * 0.62,
        hh * 0.56,
        10 * s,
        id === 'sewage' ? '#7aa0bc' : '#8a8490',
        '#354858',
        '#4a5c6c',
      );
      ctx.fillStyle = id === 'sewage' ? '#4a90a4' : '#5a5560';
      ctx.beginPath();
      ctx.arc(cx + 6 * s, cy - 12 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'police': {
      isoBox(ctx, cx, cy, hw * 0.66, hh * 0.6, 15 * s, '#5a80b8', '#1a2f52', '#2d4a78');
      const siren = Math.sin(t / 160) > 0;
      ctx.fillStyle = siren ? '#ff3355' : '#3a8fd4';
      ctx.beginPath();
      ctx.arc(cx, cy - 20 * s, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${siren ? '255,50,80' : '60,150,220'},0.25)`;
      ctx.beginPath();
      ctx.arc(cx, cy - 20 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      windowRow(ctx, cx - 7 * s, cy - 14 * s, 14 * s, 2, 2, true, t);
      break;
    }
    case 'fire': {
      isoBox(ctx, cx, cy, hw * 0.66, hh * 0.6, 15 * s, '#ff7b7b', '#a01018', '#d42a38');
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${10 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🚒', cx, cy - 10 * s);
      // flame
      ctx.fillStyle = `rgba(255,160,40,${0.4 + 0.35 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(cx + 8 * s, cy - 22 * s);
      ctx.quadraticCurveTo(cx + 12 * s, cy - 30 * s, cx + 8 * s, cy - 34 * s);
      ctx.quadraticCurveTo(cx + 4 * s, cy - 28 * s, cx + 8 * s, cy - 22 * s);
      ctx.fill();
      break;
    }
    case 'hospital': {
      isoBox(ctx, cx, cy, hw * 0.72, hh * 0.66, 17 * s, '#f5f7fa', '#b8c0c8', '#d5dce2');
      ctx.fillStyle = '#e63946';
      ctx.fillRect(cx - 2.5 * s, cy - 20 * s, 5 * s, 14 * s);
      ctx.fillRect(cx - 7 * s, cy - 16 * s, 14 * s, 5 * s);
      ctx.fillStyle = `rgba(230,57,70,${0.2 + 0.15 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 22 * s, 12 * s, 0, Math.PI * 2);
      ctx.fill();
      windowRow(ctx, cx - 8 * s, cy - 8 * s, 16 * s, 1, 3, true, t);
      break;
    }
    case 'park': {
      isoDiamond(ctx, cx, cy, hw, hh, '#3f9664', 'rgba(0,0,0,0.12)');
      // path
      ctx.strokeStyle = 'rgba(220,200,160,0.45)';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.35, cy);
      ctx.lineTo(cx + hw * 0.35, cy);
      ctx.stroke();
      tree(ctx, cx - 7 * s, cy - 2 * s, s * 0.95);
      tree(ctx, cx + 8 * s, cy, s * 0.8, '#245c40');
      tree(ctx, cx, cy - 10 * s, s * 1.1, '#2d6a4f');
      // bench
      ctx.fillStyle = '#8b5e34';
      ctx.fillRect(cx + 2 * s, cy + 2 * s, 8 * s, 2 * s);
      break;
    }
    case 'school':
    case 'uni': {
      isoBox(
        ctx,
        cx,
        cy,
        hw * 0.78,
        hh * 0.72,
        id === 'uni' ? 22 * s : 15 * s,
        '#f7b27a',
        '#a85822',
        '#d07a32',
      );
      windowRow(ctx, cx - 8 * s, cy - (id === 'uni' ? 18 : 12) * s, 16 * s, 2, 3, true, t);
      if (id === 'uni') {
        ctx.fillStyle = '#f0d56a';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 40 * s);
        ctx.lineTo(cx + 12 * s, cy - 24 * s);
        ctx.lineTo(cx - 12 * s, cy - 24 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c1121f';
        ctx.fillRect(cx - 1 * s, cy - 48 * s, 2 * s, 10 * s);
      }
      break;
    }
    case 'station':
    case 'airport': {
      isoBox(ctx, cx, cy, hw * 0.88, hh * 0.78, 11 * s, '#a8daf0', '#1a8aaa', '#40b8d4');
      if (id === 'airport') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5 * s;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(cx - 18 * s, cy);
        ctx.lineTo(cx + 18 * s, cy);
        ctx.moveTo(cx, cy - 9 * s);
        ctx.lineTo(cx, cy + 9 * s);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // beacon
        ctx.fillStyle = `rgba(255,80,80,${0.4 + 0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(cx + 12 * s, cy - 16 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#1d3557';
        ctx.fillRect(cx - 10 * s, cy - 4 * s, 20 * s, 3 * s);
      }
      break;
    }
    case 'cinema': {
      isoBox(ctx, cx, cy, hw * 0.72, hh * 0.66, 13 * s, '#b02830', '#5a0810', '#9a1818');
      ctx.fillStyle = `rgba(255,210,110,${0.45 + 0.35 * pulse})`;
      ctx.fillRect(cx - 9 * s, cy - 15 * s, 18 * s, 7 * s);
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx - 7 * s + i * 4 * s, cy - 13 * s, 2 * s, 3 * s);
      }
      break;
    }
    case 'stadium': {
      const bowl = ctx.createRadialGradient(cx, cy - 4 * s, 4 * s, cx, cy - 4 * s, hw);
      bowl.addColorStop(0, '#6bcf9a');
      bowl.addColorStop(0.55, '#2a9d8f');
      bowl.addColorStop(1, '#1a6a60');
      ctx.fillStyle = bowl;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4 * s, hw * 0.98, hh * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.8 * s;
      ctx.stroke();
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4 * s, hw * 0.52, hh * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // floodlights
      for (const ox of [-14, 14]) {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(cx + ox * s - 1 * s, cy - 28 * s, 2 * s, 18 * s);
        ctx.fillStyle = `rgba(255,245,180,${0.25 + 0.2 * pulse})`;
        ctx.beginPath();
        ctx.arc(cx + ox * s, cy - 30 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'landmark': {
      isoDiamond(ctx, cx, cy, hw * 0.75, hh * 0.75, '#4a3a5a');
      // pedestal
      isoBox(ctx, cx, cy, hw * 0.35, hh * 0.32, 6 * s, '#d4c4f0', '#6a5a88', '#8a7aa8');
      const shaft = ctx.createLinearGradient(cx, cy, cx, cy - 48 * s);
      shaft.addColorStop(0, '#a88cf0');
      shaft.addColorStop(1, '#f0e8ff');
      ctx.fillStyle = shaft;
      ctx.fillRect(cx - 3.5 * s, cy - 48 * s, 7 * s, 42 * s);
      ctx.beginPath();
      ctx.arc(cx, cy - 52 * s, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,236,160,${0.3 + 0.3 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 52 * s, 16 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'depot': {
      isoBox(ctx, cx, cy, hw * 0.78, hh * 0.72, 12 * s, '#f0b04a', '#8a5018', '#b86a28');
      ctx.fillStyle = '#5a4638';
      ctx.fillRect(cx - 12 * s, cy - 5 * s, 9 * s, 6 * s);
      ctx.fillRect(cx + 3 * s, cy - 5 * s, 9 * s, 6 * s);
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(cx - 10 * s, cy - 8 * s, 5 * s, 3 * s);
      break;
    }
    default: {
      isoBox(ctx, cx, cy, hw * 0.6, hh * 0.55, H, '#8899aa', '#445566', '#667788');
    }
  }

  if (wear > 28) {
    ctx.strokeStyle = `rgba(40,20,10,${Math.min(0.75, wear / 110)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - 7 * s, cy - 9 * s);
    ctx.lineTo(cx + 3 * s, cy + 3 * s);
    ctx.moveTo(cx + 5 * s, cy - 12 * s);
    ctx.lineTo(cx + 9 * s, cy + 1 * s);
    ctx.stroke();
  }
}

// Fix hospital: the case broke early with typo. Redraw hospital in a cleaner way by patching drawBuildingSprite hospital case.
// Re-export a dedicated draw for hospital called from patched switch — rewrite hospital case properly via StrReplace.
