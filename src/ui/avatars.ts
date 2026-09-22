/** High-quality portrait avatars for club, trade & HUD */

export const AVATARS: Record<
  string,
  { file: string; title: string; role: string }
> = {
  player: { file: '/avatars/avatar_player.png', title: 'Bürgermeister', role: 'Du' },
  lina: { file: '/avatars/avatar_lina.png', title: 'Strategin', role: 'Club' },
  omar: { file: '/avatars/avatar_omar.png', title: 'Logistik', role: 'Club' },
  mira: { file: '/avatars/avatar_mira.png', title: 'Innovatorin', role: 'Club' },
  alex: { file: '/avatars/avatar_alex.png', title: 'Händler', role: 'Markt' },
  sam: { file: '/avatars/avatar_sam.png', title: 'Brokerin', role: 'Markt' },
  kai: { file: '/avatars/avatar_kai.png', title: 'Lieferant', role: 'Markt' },
  ada: { file: '/avatars/avatar_ada.png', title: 'Investorin', role: 'Markt' },
};

export const TRADER_IDS = ['alex', 'sam', 'kai', 'ada'] as const;

export function avatarUrl(id: string): string {
  return AVATARS[id]?.file ?? AVATARS.player.file;
}

export function avatarMeta(id: string) {
  return AVATARS[id] ?? AVATARS.player;
}

export function avatarCard(
  id: string,
  opts: { name?: string; subtitle?: string; size?: 'sm' | 'md' | 'lg'; rank?: number; score?: number; you?: boolean } = {},
): string {
  const meta = avatarMeta(id);
  const size = opts.size ?? 'md';
  const name = opts.name ?? meta.title;
  const sub = opts.subtitle ?? meta.role;
  const rank = opts.rank != null ? `<span class="av-rank">#${opts.rank}</span>` : '';
  const score = opts.score != null ? `<span class="av-score">${opts.score} Pkt</span>` : '';
  const you = opts.you ? ' you' : '';
  return `<div class="avatar-card size-${size}${you}">
    <div class="avatar-ring">
      <img class="avatar-img" src="${avatarUrl(id)}" alt="${name}" width="256" height="256" loading="lazy" decoding="async" />
      ${rank}
    </div>
    <div class="avatar-meta">
      <strong>${name}${opts.you ? ' · Du' : ''}</strong>
      <span class="muted">${sub}</span>
      ${score}
    </div>
  </div>`;
}
