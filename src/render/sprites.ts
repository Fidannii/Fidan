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

/** Simple extruded box (voxel-style) */
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
  // top
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh - h);
  ctx.lineTo(cx + hw, cy - h);
  ctx.lineTo(cx, cy + hh - h);
  ctx.lineTo(cx - hw, cy - h);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();

  // left face
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - h);
  ctx.lineTo(cx, cy + hh - h);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = left;
  ctx.fill();

  // right face
  ctx.beginPath();
  ctx.moveTo(cx + hw, cy - h);
  ctx.lineTo(cx, cy + hh - h);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx + hw, cy);
  ctx.closePath();
  ctx.fillStyle = right;
  ctx.fill();
}

function windowRow(ctx: DrawCtx, x: number, y: number, w: number, rows: number, cols: number, lit: boolean) {
  const gw = w / (cols + 1);
  const gh = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = lit && (r + c) % 3 !== 0 ? 'rgba(255,230,140,0.85)' : 'rgba(20,40,55,0.65)';
      ctx.fillRect(x + gw * (c + 0.35), y + r * (gh + 2), Math.max(2, gw * 0.45), gh);
    }
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
  const shadow = `rgba(0,0,0,${0.28 + wear / 400})`;

  // soft ground shadow
  ctx.save();
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2 * s, hw * 0.92, hh * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const H = (12 + level * 4) * s;

  switch (id) {
    case 'road':
    case 'highway': {
      isoDiamond(ctx, cx, cy, hw, hh, id === 'highway' ? '#2f3338' : '#5a5f66', 'rgba(0,0,0,0.15)');
      ctx.strokeStyle = id === 'highway' ? '#f0d56a' : 'rgba(240,240,240,0.55)';
      ctx.lineWidth = Math.max(1, 1.5 * s);
      ctx.setLineDash(id === 'highway' ? [] : [4 * s, 4 * s]);
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.45, cy);
      ctx.lineTo(cx + hw * 0.45, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      if (id === 'highway') {
        ctx.beginPath();
        ctx.moveTo(cx, cy - hh * 0.4);
        ctx.lineTo(cx, cy + hh * 0.4);
        ctx.stroke();
      }
      break;
    }
    case 'house': {
      const h = (12 + level * 7) * s;
      isoBox(ctx, cx, cy, hw * 0.78, hh * 0.78, h, '#f0c49a', '#a66b3c', '#c4844f');
      // roof
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh * 0.78 - h - 10 * s);
      ctx.lineTo(cx + hw * 0.9, cy - h + 2 * s);
      ctx.lineTo(cx, cy + hh * 0.15 - h);
      ctx.lineTo(cx - hw * 0.9, cy - h + 2 * s);
      ctx.closePath();
      const roof = ctx.createLinearGradient(cx - hw, cy - h, cx + hw, cy - h);
      roof.addColorStop(0, level >= 3 ? '#5c2a3a' : '#7a3b1e');
      roof.addColorStop(1, level >= 3 ? '#8b4558' : '#a85228');
      ctx.fillStyle = roof;
      ctx.fill();
      // chimney
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(cx + 6 * s, cy - h - 16 * s, 4 * s, 10 * s);
      windowRow(ctx, cx - 7 * s, cy - h + 5 * s, 14 * s, Math.min(4, level + 1), 2, true);
      // door
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(cx - 3 * s, cy - 2 * s, 6 * s, 8 * s);
      if (level >= 4) {
        ctx.fillStyle = '#d8dee6';
        ctx.fillRect(cx - 3 * s, cy - h - 28 * s, 6 * s, 22 * s);
        ctx.fillStyle = `rgba(255,220,120,${0.35 + 0.25 * Math.sin(t / 500)})`;
        ctx.beginPath();
        ctx.arc(cx, cy - h - 32 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'woodcutter': {
      isoBox(ctx, cx, cy, hw * 0.5, hh * 0.5, 9 * s, '#4caf76', '#2d6a4f', '#3d8b5f');
      // stacked logs
      ctx.fillStyle = '#6b4226';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(cx - 10 * s + i * 3 * s, cy + 2 * s, 5 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // pine
      ctx.fillStyle = '#1b4332';
      for (const [oy, r] of [
        [-8, 9],
        [-16, 7],
        [-23, 5],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(cx + 10 * s, cy + oy * s + 8 * s);
        ctx.lineTo(cx + 10 * s + r * s, cy + oy * s + 8 * s);
        ctx.lineTo(cx + 10 * s, cy + oy * s - r * 0.3 * s);
        ctx.lineTo(cx + 10 * s - r * s, cy + oy * s + 8 * s);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(cx + 9 * s, cy, 3 * s, 8 * s);
      break;
    }
    case 'power': {
      isoBox(ctx, cx, cy, hw * 0.5, hh * 0.48, 9 * s, '#ffe066', '#c9a227', '#e0b93a');
      // twin cooling towers
      for (const ox of [-8, 8]) {
        ctx.fillStyle = '#e8eef2';
        ctx.beginPath();
        ctx.moveTo(cx + ox * s - 5 * s, cy);
        ctx.quadraticCurveTo(cx + ox * s - 7 * s, cy - 18 * s, cx + ox * s - 3 * s, cy - 30 * s);
        ctx.lineTo(cx + ox * s + 3 * s, cy - 30 * s);
        ctx.quadraticCurveTo(cx + ox * s + 7 * s, cy - 18 * s, cx + ox * s + 5 * s, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(210,215,225,${0.25 + 0.2 * Math.sin(t / 350 + ox)})`;
        ctx.beginPath();
        ctx.arc(cx + ox * s, cy - 36 * s - Math.sin(t / 400) * 3 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'water': {
      // tower base
      isoBox(ctx, cx, cy, hw * 0.35, hh * 0.32, 8 * s, '#8ecae6', '#1d6f94', '#3d9bc4');
      // tank
      const tg = ctx.createLinearGradient(cx - 10 * s, cy - 28 * s, cx + 10 * s, cy - 8 * s);
      tg.addColorStop(0, '#bde0fe');
      tg.addColorStop(0.5, '#4ea8de');
      tg.addColorStop(1, '#1d6f94');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 20 * s, 11 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.2 * Math.sin(t / 400)})`;
      ctx.beginPath();
      ctx.ellipse(cx - 3 * s, cy - 22 * s, 4 * s, 2.5 * s, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.strokeStyle = '#3d5a6c';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 6 * s, cy - 12 * s);
      ctx.lineTo(cx - 8 * s, cy + 2 * s);
      ctx.moveTo(cx + 6 * s, cy - 12 * s);
      ctx.lineTo(cx + 8 * s, cy + 2 * s);
      ctx.stroke();
      break;
    }
    case 'sawmill': {
      isoBox(ctx, cx, cy, hw * 0.7, hh * 0.65, 12 * s, '#c4a574', '#8a6a3e', '#a07d4c');
      ctx.strokeStyle = '#5c4030';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(cx + 4 * s, cy - 6 * s, 6 * s, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'mine': {
      isoBox(ctx, cx, cy, hw * 0.65, hh * 0.6, 8 * s, '#8a9099', '#555b66', '#6a717c');
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(cx - 4 * s, cy + 2 * s, 6 * s, 3 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chem':
    case 'plastics': {
      isoBox(ctx, cx, cy, hw * 0.6, hh * 0.55, 14 * s, id === 'chem' ? '#9b5de5' : '#7b2cbf', '#5a189a', '#6a2c9e');
      // chimney smoke
      ctx.fillStyle = shade('#888', 20);
      ctx.fillRect(cx + 6 * s, cy - 28 * s, 3 * s, 16 * s);
      const smoke = 0.35 + 0.25 * Math.sin(t / 400);
      ctx.fillStyle = `rgba(200,200,210,${smoke})`;
      ctx.beginPath();
      ctx.arc(cx + 8 * s, cy - 32 * s - Math.sin(t / 300) * 4 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'glassworks': {
      isoBox(ctx, cx, cy, hw * 0.65, hh * 0.6, 12 * s, '#a8e0f0', '#4fa8c0', '#6bc0d6');
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(cx - 4 * s, cy - 14 * s, 8 * s, 6 * s);
      break;
    }
    case 'workshop': {
      isoBox(ctx, cx, cy, hw * 0.65, hh * 0.6, 11 * s, '#f4a261', '#c45c2a', '#e0763a');
      break;
    }
    case 'textile': {
      isoBox(ctx, cx, cy, hw * 0.65, hh * 0.6, 11 * s, '#f72585', '#a0165a', '#c91e6e');
      break;
    }
    case 'furniture': {
      isoBox(ctx, cx, cy, hw * 0.7, hh * 0.65, 13 * s, '#d4a373', '#8b5e34', '#a67240');
      break;
    }
    case 'solar': {
      isoDiamond(ctx, cx, cy, hw, hh, '#1a3a4a');
      ctx.fillStyle = '#1d3557';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 8 * s, cy - 6 * s);
        ctx.lineTo(cx + 10 * s + i * 8 * s, cy);
        ctx.lineTo(cx + i * 8 * s, cy + 6 * s);
        ctx.lineTo(cx - 10 * s + i * 8 * s, cy);
        ctx.closePath();
        ctx.fillStyle = i === 0 ? '#4cc9f0' : '#2892b8';
        ctx.fill();
      }
      // sun glint
      ctx.fillStyle = `rgba(255,255,200,${0.35 + 0.25 * Math.sin(t / 500)})`;
      ctx.beginPath();
      ctx.arc(cx + 6 * s, cy - 4 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sewage':
    case 'waste': {
      isoBox(
        ctx,
        cx,
        cy,
        hw * 0.6,
        hh * 0.55,
        9 * s,
        id === 'sewage' ? '#6a8fad' : '#7d7885',
        '#3d5568',
        '#516879',
      );
      break;
    }
    case 'police': {
      isoBox(ctx, cx, cy, hw * 0.65, hh * 0.6, 14 * s, '#4a6fa5', '#1d3557', '#2d4a73');
      ctx.fillStyle = Math.sin(t / 200) > 0 ? '#e63946' : '#457b9d';
      ctx.beginPath();
      ctx.arc(cx, cy - 18 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'fire': {
      isoBox(ctx, cx, cy, hw * 0.65, hh * 0.6, 14 * s, '#ff6b6b', '#c1121f', '#e63946');
      break;
    }
    case 'hospital': {
      isoBox(ctx, cx, cy, hw * 0.7, hh * 0.65, 16 * s, '#f8f9fa', '#c9d0d6', '#dde2e6');
      ctx.fillStyle = '#e63946';
      ctx.fillRect(cx - 2 * s, cy - 18 * s, 4 * s, 12 * s);
      ctx.fillRect(cx - 6 * s, cy - 14 * s, 12 * s, 4 * s);
      break;
    }
    case 'park': {
      isoDiamond(ctx, cx, cy, hw, hh, '#3d8b5f', 'rgba(0,0,0,0.1)');
      for (const [ox, oy, r] of [
        [-6, -8, 7],
        [8, -6, 6],
        [0, -14, 8],
      ] as const) {
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.arc(cx + ox * s, cy + oy * s, r * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#40916c';
        ctx.beginPath();
        ctx.arc(cx + ox * s - 2 * s, cy + oy * s - 2 * s, (r * 0.45) * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'school':
    case 'uni': {
      isoBox(
        ctx,
        cx,
        cy,
        hw * 0.75,
        hh * 0.7,
        id === 'uni' ? 20 * s : 14 * s,
        '#f4a261',
        '#b8652a',
        '#d97b35',
      );
      if (id === 'uni') {
        ctx.fillStyle = '#e9c46a';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 36 * s);
        ctx.lineTo(cx + 10 * s, cy - 22 * s);
        ctx.lineTo(cx - 10 * s, cy - 22 * s);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'station':
    case 'airport': {
      isoBox(ctx, cx, cy, hw * 0.85, hh * 0.75, 10 * s, '#8ecae6', '#219ebc', '#48cae4');
      if (id === 'airport') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(cx - 16 * s, cy);
        ctx.lineTo(cx + 16 * s, cy);
        ctx.moveTo(cx, cy - 8 * s);
        ctx.lineTo(cx, cy + 8 * s);
        ctx.stroke();
      }
      break;
    }
    case 'cinema': {
      isoBox(ctx, cx, cy, hw * 0.7, hh * 0.65, 12 * s, '#9b2226', '#6a040f', '#ae2012');
      ctx.fillStyle = `rgba(255,200,100,${0.4 + 0.3 * Math.sin(t / 250)})`;
      ctx.fillRect(cx - 8 * s, cy - 14 * s, 16 * s, 6 * s);
      break;
    }
    case 'stadium': {
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4 * s, hw * 0.95, hh * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4 * s, hw * 0.55, hh * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'landmark': {
      // statue / tower
      ctx.fillStyle = '#cbb2fe';
      ctx.fillRect(cx - 3 * s, cy - 40 * s, 6 * s, 40 * s);
      ctx.beginPath();
      ctx.arc(cx, cy - 44 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,236,160,${0.35 + 0.25 * Math.sin(t / 600)})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 44 * s, 14 * s, 0, Math.PI * 2);
      ctx.fill();
      isoDiamond(ctx, cx, cy, hw * 0.7, hh * 0.7, '#5a4a6a');
      break;
    }
    case 'depot': {
      isoBox(ctx, cx, cy, hw * 0.75, hh * 0.7, 11 * s, '#e09f3e', '#9c5c1a', '#bc6c25');
      ctx.fillStyle = '#6c584c';
      ctx.fillRect(cx - 10 * s, cy - 4 * s, 8 * s, 5 * s);
      ctx.fillRect(cx + 2 * s, cy - 4 * s, 8 * s, 5 * s);
      break;
    }
    default: {
      isoBox(ctx, cx, cy, hw * 0.6, hh * 0.55, H, '#88a', '#556', '#667');
    }
  }

  // wear cracks overlay
  if (wear > 30) {
    ctx.strokeStyle = `rgba(40,20,10,${Math.min(0.7, wear / 120)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 6 * s, cy - 8 * s);
    ctx.lineTo(cx + 2 * s, cy + 2 * s);
    ctx.moveTo(cx + 4 * s, cy - 10 * s);
    ctx.lineTo(cx + 8 * s, cy);
    ctx.stroke();
  }
}
