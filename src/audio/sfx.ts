/** Procedural SFX via Web Audio — no asset files needed */

const SETTINGS_KEY = 'metrobuilder-settings-v1';

export interface AudioSettings {
  sfx: boolean;
  music: boolean;
  haptics: boolean;
}

let ctx: AudioContext | null = null;
let musicTimer: number | null = null;
let settings: AudioSettings = loadSettings();

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { sfx: true, music: true, haptics: true, ...JSON.parse(raw) };
  } catch {
    /* */
  }
  return { sfx: true, music: true, haptics: true };
}

export function getAudioSettings(): AudioSettings {
  return { ...settings };
}

export function setAudioSettings(partial: Partial<AudioSettings>) {
  settings = { ...settings, ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  if (!settings.music) stopMusic();
  else startMusic();
}

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
  when = 0,
) {
  if (!settings.sfx) return;
  const c = ac();
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function sfxClick() {
  tone(520, 0.06, 'triangle', 0.05);
}

export function sfxPlace() {
  tone(180, 0.08, 'square', 0.06);
  tone(240, 0.1, 'triangle', 0.04, 0.05);
}

export function sfxCollect() {
  tone(660, 0.08, 'sine', 0.07);
  tone(880, 0.1, 'sine', 0.05, 0.06);
}

export function sfxUpgrade() {
  tone(400, 0.1, 'sawtooth', 0.04);
  tone(600, 0.12, 'triangle', 0.05, 0.08);
  tone(800, 0.14, 'sine', 0.05, 0.16);
}

export function sfxLevelUp() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'sine', 0.07, i * 0.1));
}

export function sfxBuy() {
  tone(900, 0.07, 'square', 0.04);
  tone(1200, 0.1, 'sine', 0.05, 0.05);
}

export function sfxDisaster() {
  tone(90, 0.35, 'sawtooth', 0.06);
  tone(70, 0.4, 'square', 0.04, 0.1);
}

export function sfxExpand() {
  tone(300, 0.12, 'triangle', 0.06);
  tone(450, 0.14, 'sine', 0.05, 0.1);
}

export function sfxError() {
  tone(160, 0.12, 'square', 0.05);
}

function musicNote(freq: number, when: number, dur = 0.35) {
  if (!settings.music || !ctx) return;
  const c = ctx;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.025, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function startMusic() {
  if (!settings.music) return;
  stopMusic();
  ac();
  const loop = () => {
    if (!settings.music) return;
    // soft pentatonic ambient loop
    const base = [262, 294, 330, 392, 440, 523];
    for (let i = 0; i < 6; i++) {
      const f = base[(i * 2 + Math.floor(Math.random() * 2)) % base.length];
      musicNote(f, i * 0.55, 0.7);
    }
    musicTimer = window.setTimeout(loop, 3600);
  };
  loop();
}

export function stopMusic() {
  if (musicTimer != null) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

export function unlockAudio() {
  try {
    ac();
    if (settings.music) startMusic();
  } catch {
    /* */
  }
}
