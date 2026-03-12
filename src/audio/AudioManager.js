/**
 * AudioManager — procedural Web Audio API sound effects.
 * All methods are safe no-ops when running in non-browser environments (e.g.
 * Vitest / Node.js) or when AudioContext is unavailable.
 */

let _ctx = null;
let _masterVol = 0.85;
let _sfxVol = 1.0;
let _musicVol = 0.7;
let _musicTimer = null;
let _musicMode = null;
let _musicGain = null; // master bus for all music — enables fade-out
const MENU_MUSIC_ENABLED = true;
const GAME_MUSIC_ENABLED = true;

const MENU_THEME_BPM = 134;
const MENU_THEME_VARIANT_BEATS = 32;
const MENU_THEME_LOOKAHEAD_SECONDS = 0.55;
const MENU_THEME_SCHEDULER_MS = 120;

const MENU_THEME_VARIANTS = [
  [
    { beat: 0.0, midi: 71, len: 0.5, vol: 0.058, type: "square" },
    { beat: 0.5, midi: 74, len: 0.5, vol: 0.058, type: "square" },
    { beat: 1.0, midi: 76, len: 1.0, vol: 0.064 },
    { beat: 2.0, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 2.5, midi: 76, len: 0.5, vol: 0.058 },
    { beat: 3.0, midi: 74, len: 1.0, vol: 0.056 },

    { beat: 4.0, midi: 76, len: 0.5, vol: 0.060, type: "square" },
    { beat: 4.5, midi: 79, len: 0.5, vol: 0.063, type: "square" },
    { beat: 5.0, midi: 81, len: 1.0, vol: 0.069 },
    { beat: 6.0, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 6.5, midi: 78, len: 0.5, vol: 0.062 },
    { beat: 7.0, midi: 76, len: 1.0, vol: 0.058 },

    { beat: 8.0, midi: 74, len: 0.5, vol: 0.055 },
    { beat: 8.5, midi: 76, len: 0.5, vol: 0.058 },
    { beat: 9.0, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 9.5, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 10.0, midi: 83, len: 1.0, vol: 0.072 },
    { beat: 11.0, midi: 81, len: 1.0, vol: 0.067 },

    { beat: 12.0, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 12.5, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 13.0, midi: 76, len: 0.5, vol: 0.059 },
    { beat: 13.5, midi: 74, len: 0.5, vol: 0.056 },
    { beat: 14.0, midi: 73, len: 1.0, vol: 0.054 },
    { beat: 15.0, midi: 74, len: 1.0, vol: 0.056 },

    { beat: 16.0, midi: 76, len: 0.5, vol: 0.061 },
    { beat: 16.5, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 17.0, midi: 81, len: 0.5, vol: 0.069 },
    { beat: 17.5, midi: 83, len: 0.5, vol: 0.072 },
    { beat: 18.0, midi: 85, len: 1.0, vol: 0.076 },
    { beat: 19.0, midi: 83, len: 1.0, vol: 0.071 },

    { beat: 20.0, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 20.5, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 21.0, midi: 78, len: 1.0, vol: 0.061 },
    { beat: 22.0, midi: 76, len: 0.5, vol: 0.059 },
    { beat: 22.5, midi: 78, len: 0.5, vol: 0.060 },
    { beat: 23.0, midi: 79, len: 1.0, vol: 0.063 },

    { beat: 24.0, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 24.5, midi: 83, len: 0.5, vol: 0.071 },
    { beat: 25.0, midi: 85, len: 1.0, vol: 0.075 },
    { beat: 26.0, midi: 83, len: 0.5, vol: 0.071 },
    { beat: 26.5, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 27.0, midi: 79, len: 1.0, vol: 0.063 },

    { beat: 28.0, midi: 78, len: 0.5, vol: 0.060 },
    { beat: 28.5, midi: 76, len: 0.5, vol: 0.058 },
    { beat: 29.0, midi: 74, len: 0.5, vol: 0.055 },
    { beat: 29.5, midi: 76, len: 0.5, vol: 0.057 },
    { beat: 30.0, midi: 73, len: 0.5, vol: 0.053 },
    { beat: 30.5, midi: 71, len: 0.5, vol: 0.050 },
    { beat: 31.0, midi: 69, len: 1.0, vol: 0.052, type: "square" },
  ],
  [
    { beat: 0.0, midi: 74, len: 0.5, vol: 0.058, type: "square" },
    { beat: 0.5, midi: 76, len: 0.5, vol: 0.061, type: "square" },
    { beat: 1.0, midi: 78, len: 1.0, vol: 0.064 },
    { beat: 2.0, midi: 81, len: 0.5, vol: 0.069 },
    { beat: 2.5, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 3.0, midi: 76, len: 1.0, vol: 0.058 },

    { beat: 4.0, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 4.5, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 5.0, midi: 83, len: 1.0, vol: 0.072 },
    { beat: 6.0, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 6.5, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 7.0, midi: 78, len: 1.0, vol: 0.061 },

    { beat: 8.0, midi: 76, len: 0.5, vol: 0.058 },
    { beat: 8.5, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 9.0, midi: 79, len: 0.5, vol: 0.063 },
    { beat: 9.5, midi: 83, len: 0.5, vol: 0.071 },
    { beat: 10.0, midi: 86, len: 1.0, vol: 0.078 },
    { beat: 11.0, midi: 83, len: 1.0, vol: 0.071 },

    { beat: 12.0, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 12.5, midi: 79, len: 0.5, vol: 0.064 },
    { beat: 13.0, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 13.5, midi: 76, len: 0.5, vol: 0.058 },
    { beat: 14.0, midi: 74, len: 1.0, vol: 0.055 },
    { beat: 15.0, midi: 73, len: 1.0, vol: 0.053 },

    { beat: 16.0, midi: 74, len: 0.5, vol: 0.055 },
    { beat: 16.5, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 17.0, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 17.5, midi: 84, len: 0.5, vol: 0.074 },
    { beat: 18.0, midi: 88, len: 1.0, vol: 0.081 },
    { beat: 19.0, midi: 86, len: 1.0, vol: 0.078 },

    { beat: 20.0, midi: 84, len: 0.5, vol: 0.074 },
    { beat: 20.5, midi: 83, len: 0.5, vol: 0.071 },
    { beat: 21.0, midi: 81, len: 1.0, vol: 0.067 },
    { beat: 22.0, midi: 79, len: 0.5, vol: 0.063 },
    { beat: 22.5, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 23.0, midi: 76, len: 1.0, vol: 0.058 },

    { beat: 24.0, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 24.5, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 25.0, midi: 84, len: 0.5, vol: 0.074 },
    { beat: 25.5, midi: 86, len: 0.5, vol: 0.078 },
    { beat: 26.0, midi: 88, len: 1.0, vol: 0.082, type: "square" },
    { beat: 27.0, midi: 86, len: 1.0, vol: 0.077 },

    { beat: 28.0, midi: 84, len: 0.5, vol: 0.073 },
    { beat: 28.5, midi: 81, len: 0.5, vol: 0.067 },
    { beat: 29.0, midi: 78, len: 0.5, vol: 0.061 },
    { beat: 29.5, midi: 76, len: 0.5, vol: 0.058 },
    { beat: 30.0, midi: 74, len: 0.5, vol: 0.055 },
    { beat: 30.5, midi: 71, len: 0.5, vol: 0.050 },
    { beat: 31.0, midi: 69, len: 1.0, vol: 0.052, type: "square" },
  ],
];

function getMusicBusTargetGain() {
  return Math.max(1 / 10000, _masterVol * _musicVol);
}

function applyMusicBusVolume() {
  const ctx = getCtx();
  const bus = getMusicGain();
  if (!ctx || !bus) {
    return;
  }
  try {
    bus.gain.setValueAtTime(getMusicBusTargetGain(), ctx.currentTime);
  } catch {
    // Never block gameplay on audio failures.
  }
}

function getCtx() {
  return _ctx ?? null;
}

// Creates the AudioContext — call only after a confirmed user gesture.
function ensureCtx() {
  if (_ctx) {
    return _ctx;
  }
  const Ctor =
    typeof globalThis !== "undefined" &&
    (globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null);
  if (!Ctor) {
    return null;
  }
  try {
    _ctx = new Ctor();
  } catch {
    return null;
  }
  return _ctx;
}

function playTone(freq, dur, type = "square", vol = 0.16) {
  const ctx = getCtx();
  if (!ctx) {
    return;
  }
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const effectiveVol = vol * _masterVol * _sfxVol;
    gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.02);
  } catch {
    // Silently ignore audio errors so gameplay is never blocked.
  }
}

function later(fn, ms) {
  if (typeof setTimeout === "function") {
    setTimeout(fn, ms);
  }
}

function clearMusicTimer() {
  if (_musicTimer) {
    if (typeof clearInterval === "function") clearInterval(_musicTimer);
    if (typeof clearTimeout === "function") clearTimeout(_musicTimer);
  }
  _musicTimer = null;
}

function getMusicGain() {
  const ctx = getCtx();
  if (!ctx) return null;
  if (!_musicGain) {
    _musicGain = ctx.createGain();
    _musicGain.gain.setValueAtTime(getMusicBusTargetGain(), ctx.currentTime);
    _musicGain.connect(ctx.destination);
  }
  return _musicGain;
}

function playMusicNote(freq, dur, type = "triangle", vol = 0.08, when = null) {
  const ctx = getCtx();
  if (!ctx) {
    return;
  }
  try {
    const startAt = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const bus = getMusicGain();
    osc.connect(gain);
    gain.connect(bus ?? ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);

    const effectiveVol = vol;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, effectiveVol), startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    osc.start(startAt);
    osc.stop(startAt + dur + 0.03);
  } catch {
    // Never block gameplay on audio failures.
  }
}

function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function scheduleMenuThemeVariant(startAt, variant) {
  const beatDur = 60 / MENU_THEME_BPM;
  variant.forEach((note) => {
    const when = startAt + note.beat * beatDur;
    const duration = Math.max(0.12, note.len * beatDur - 0.03);
    playMusicNote(midiToFreq(note.midi), duration, note.type ?? "triangle", note.vol, when);
  });
}

function startMenuThemeLoop() {
  const ctx = getCtx();
  if (!ctx) {
    return;
  }

  const beatDur = 60 / MENU_THEME_BPM;
  const variantDuration = MENU_THEME_VARIANT_BEATS * beatDur;

  let nextStartAt = ctx.currentTime + 0.1;
  let nextVariantIndex = 0;

  const scheduler = () => {
    const now = ctx.currentTime;
    while (nextStartAt <= now + MENU_THEME_LOOKAHEAD_SECONDS) {
      const variant = MENU_THEME_VARIANTS[nextVariantIndex];
      scheduleMenuThemeVariant(nextStartAt, variant);
      nextStartAt += variantDuration;
      nextVariantIndex = (nextVariantIndex + 1) % MENU_THEME_VARIANTS.length;
    }
  };

  scheduler();
  _musicTimer = setInterval(scheduler, MENU_THEME_SCHEDULER_MS);
}

function startGameBassLoop() {
  const ctx = getCtx();
  if (!ctx) {
    return;
  }

  const stepMs = 300;
  const pattern = [55, 55, 61.74, 55, 49, 49, 61.74, 55];
  let step = 0;

  const tick = () => {
    const now = ctx.currentTime + 0.02;
    const root = pattern[step % pattern.length];

    // Medium-loud low-end pulse for gameplay focus.
    playMusicNote(root, 0.22, "triangle", 0.14, now);
    if (step % 2 === 1) {
      playMusicNote(root * 2, 0.08, "square", 0.05, now + 0.08);
    }

    step += 1;
  };

  tick();
  _musicTimer = setInterval(tick, stepMs);
}

function startMusic(mode) {
  if ((mode === "menu" && !MENU_MUSIC_ENABLED) || (mode === "game" && !GAME_MUSIC_ENABLED)) {
    clearMusicTimer();
    _musicMode = null;
    return;
  }

  const ctx = getCtx();
  if (!ctx) {
    return;
  }
  if (_musicMode === mode && _musicTimer) {
    return;
  }

  clearMusicTimer();
  _musicMode = mode;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  if (mode === "menu") {
    startMenuThemeLoop();
    return;
  }

  if (mode === "game") {
    startGameBassLoop();
  }
}

export const AudioManager = {
  /** Call after a user gesture to create and resume the AudioContext. */
  resume() {
    const ctx = ensureCtx();
    if (ctx?.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  },

  /** Returns true if the AudioContext exists and is actively running. */
  isContextRunning() {
    return _ctx?.state === "running";
  },

  setMasterVolume(v) {
    _masterVol = Math.max(0, Math.min(1, v));
    applyMusicBusVolume();
  },
  setSfxVolume(v) {
    _sfxVol = Math.max(0, Math.min(1, v));
  },
  setMusicVolume(v) {
    _musicVol = Math.max(0, Math.min(1, v));
    applyMusicBusVolume();
  },
  getMasterVolume() {
    return _masterVol;
  },
  getSfxVolume() {
    return _sfxVol;
  },
  getMusicVolume() {
    return _musicVol;
  },

  playMenuMusic() {
    startMusic("menu");
  },

  playGameMusic() {
    startMusic("game");
  },

  stopMusic() {
    clearMusicTimer();
    _musicMode = null;
    // Hard-cut any already-scheduled notes by disconnecting the current bus.
    // Scheduled oscillators keep playing unless their output path is removed.
    if (_musicGain) {
      try { _musicGain.gain.cancelScheduledValues(0); } catch { /* ignore */ }
      try { _musicGain.disconnect(); } catch { /* ignore */ }
      _musicGain = null;
    }

    // Recreate a fresh bus at the configured level for the next track.
    const ctx = getCtx();
    if (ctx) {
      const bus = getMusicGain();
      if (bus) {
        try { bus.gain.setValueAtTime(getMusicBusTargetGain(), ctx.currentTime); } catch { /* ignore */ }
      }
    }
  },

  /** Fade music volume to silence over `durMs` milliseconds, then stop. */
  fadeOutMusic(durMs = 800) {
    if (!GAME_MUSIC_ENABLED) {
      this.stopMusic();
      return;
    }
    const ctx = getCtx();
    const bus = _musicGain;
    if (!ctx || !bus) {
      this.stopMusic();
      return;
    }
    const now = ctx.currentTime;
    try {
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0.0001, now + durMs / 1000);
    } catch { /* ignore */ }
    later(() => { this.stopMusic(); }, durMs);
  },

  /** Player picks up an order from the PASS counter. */
  onPickup() {
    playTone(523, 0.07, "square", 0.13);
    later(() => playTone(659, 0.1, "square", 0.11), 65);
  },

  /** Standard plate delivery (no combo active). */
  onDelivery() {
    playTone(440, 0.08, "square", 0.11);
    later(() => playTone(554, 0.09, "square", 0.11), 75);
    later(() => playTone(659, 0.16, "square", 0.15), 155);
  },

  /** Delivery when combo multiplier is active (≥ COMBO_TIER_1_THRESHOLD). */
  onComboDelivery() {
    playTone(659, 0.07, "square", 0.12);
    later(() => playTone(880, 0.07, "square", 0.13), 60);
    later(() => playTone(1109, 0.14, "square", 0.15), 120);
  },

  /** Rival waiter collision — time penalty applied. */
  onBump() {
    playTone(196, 0.11, "sawtooth", 0.09);
    later(() => playTone(165, 0.1, "sawtooth", 0.08), 90);
  },

  /** Shift / layout clear complete. */
  onShiftComplete() {
    const notes = [440, 554, 659, 880];
    notes.forEach((note, i) => later(() => playTone(note, 0.28, "square", 0.1), i * 95));
  },

  /** Timer approaching zero — played once per delivery cycle. */
  onTimerWarning() {
    playTone(330, 0.09, "square", 0.07);
    later(() => playTone(330, 0.09, "square", 0.07), 220);
  },
};
