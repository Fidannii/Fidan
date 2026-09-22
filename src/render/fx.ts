/** Screen-space floating labels & juice helpers */

export interface FloatLabel {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  max: number;
  vy: number;
}

export function spawnFloat(
  list: FloatLabel[],
  x: number,
  y: number,
  text: string,
  color = '#f0d56a',
) {
  list.push({
    x,
    y,
    text,
    color,
    life: 1,
    max: 1,
    vy: -0.55 - Math.random() * 0.35,
  });
}

export function tickFloats(
  ctx: CanvasRenderingContext2D,
  list: FloatLabel[],
  scale: number,
): FloatLabel[] {
  return list.filter((f) => {
    f.y += f.vy;
    f.vy *= 0.985;
    f.life -= 0.018;
    if (f.life <= 0) return false;
    const a = Math.min(1, f.life / f.max);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `800 ${Math.max(11, 13 * scale)}px Syne, Outfit, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
    return true;
  });
}
