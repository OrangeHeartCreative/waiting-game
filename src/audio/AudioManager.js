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
const MENU_MUSIC_ENABLED = false;
const GAME_MUSIC_ENABLED = true;

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

function startMenuWaltzMelody() {
  const ctx = getCtx();
  if (!ctx) {
    return;
  }

  // Sung waltz in A major, 66 BPM — melody only, plays once through.
  // All notes are pre-scheduled using Web Audio's sample-accurate `when`
  // clock, so timing is exact and never drifts. A single cleanup timeout
  // fires after the full piece finishes (~45 s).
  //
  // Four vocal phrases, each followed by a full-bar breath rest.
  // Dynamic arc: soft open → lyrical answer → D6 climax → resolve home.

  const q = 60 / 66; // quarter-note duration in seconds (66 BPM ≈ 0.91 s)

  // beat   : start time offset from `origin`, in quarter notes
  // freq   : Hz (A major: A4=440 B4 C#5 D5 E5 F#5 G#5 A5 B5 C#6 D6)
  // len    : duration in quarter notes
  // vol    : peak amplitude
  const notes = [
    // — Phrase 1 (bars 1–3): soft opening, rise and settle ——————————————
    { beat:  0, freq: 659.25, len: 1.0, vol: 0.050 }, // E5   — first breath
    { beat:  1, freq: 880.00, len: 1.85,vol: 0.068 }, // A5   — leap, held across bar
    { beat:  3, freq: 830.61, len: 0.9, vol: 0.054 }, // G#5  — sigh
    { beat:  4, freq: 739.99, len: 0.9, vol: 0.050 }, // F#5
    { beat:  5, freq: 659.25, len: 0.9, vol: 0.047 }, // E5
    { beat:  6, freq: 587.33, len: 1.85,vol: 0.054 }, // D5   — held
    { beat:  8, freq: 659.25, len: 0.8, vol: 0.042 }, // E5   — lift before breath
    // beats 9–11: breath ————————————————————————————————————————————————

    // — Phrase 2 (bars 5–7): lyrical answer, slightly fuller ————————————
    { beat: 12, freq: 440.00, len: 0.9, vol: 0.050 }, // A4   — low tonic answer
    { beat: 13, freq: 554.37, len: 0.9, vol: 0.056 }, // C#5  — warm lift
    { beat: 14, freq: 659.25, len: 1.85,vol: 0.065 }, // E5   — rise, held
    { beat: 16, freq: 739.99, len: 0.9, vol: 0.062 }, // F#5  — reaching
    { beat: 17, freq: 659.25, len: 0.9, vol: 0.058 }, // E5
    { beat: 18, freq: 587.33, len: 1.85,vol: 0.062 }, // D5   — held
    { beat: 20, freq: 554.37, len: 0.8, vol: 0.048 }, // C#5  — lean before breath
    // beats 21–23: breath ————————————————————————————————————————————————

    // — Phrase 3 (bars 9–12): build to D6 peak ——————————————————————————
    { beat: 24, freq: 659.25,  len: 0.9, vol: 0.062 }, // E5   — same shape, louder
    { beat: 25, freq: 739.99,  len: 0.9, vol: 0.068 }, // F#5
    { beat: 26, freq: 880.00,  len: 0.9, vol: 0.074 }, // A5   — leap
    { beat: 27, freq: 987.77,  len: 1.85,vol: 0.077 }, // B5   — soar, held
    { beat: 29, freq: 1108.73, len: 0.9, vol: 0.079 }, // C#6  — step to summit
    { beat: 30, freq: 1174.66, len: 1.85,vol: 0.083 }, // D6   — PEAK, held
    { beat: 32, freq: 987.77,  len: 0.9, vol: 0.070 }, // B5   — begin descent
    { beat: 33, freq: 880.00,  len: 1.85,vol: 0.064 }, // A5   — settle, held
    // beat 35: breath ————————————————————————————————————————————————————

    // — Phrase 4 (bars 13–16): gentle resolution home ————————————————————
    { beat: 36, freq: 739.99, len: 0.9, vol: 0.059 }, // F#5  — descent begins
    { beat: 37, freq: 659.25, len: 1.85,vol: 0.055 }, // E5   — held
    { beat: 39, freq: 587.33, len: 0.9, vol: 0.051 }, // D5
    { beat: 40, freq: 554.37, len: 1.85,vol: 0.050 }, // C#5  — held
    { beat: 42, freq: 493.88, len: 0.9, vol: 0.046 }, // B4   — deepest
    { beat: 43, freq: 554.37, len: 0.9, vol: 0.050 }, // C#5  — small uplift
    { beat: 44, freq: 659.25, len: 0.9, vol: 0.054 }, // E5   — penultimate swell
    { beat: 45, freq: 440.00, len: 2.8, vol: 0.057 }, // A4   — home, full bar, fade
  ];

  const origin = ctx.currentTime + 0.05; // small look-ahead so beat 0 never clips

  notes.forEach((n) => {
    const when = origin + n.beat * q;
    const dur  = Math.max(0.15, n.len * q - 0.10);

    // Approach from just below the target pitch on held downbeats (beats 0,3,6…)
    // — simulates a singer settling into the note.
    if (n.len >= 1.5 && Math.round(n.beat) % 3 === 0) {
      playMusicNote(n.freq * 0.974, 0.04, "sine", n.vol * 0.18, when);
    }
    playMusicNote(n.freq, dur, "triangle", n.vol, when + 0.03);
  });

  // Cleanup: mark the timer slot as idle once the last note has decayed.
  const totalMs = (48 * q + 0.5) * 1000;
  _musicTimer = setTimeout(() => { _musicTimer = null; _musicMode = null; }, totalMs);
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
    startMenuWaltzMelody();
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
    // Reset gain bus so next music starts at configured volume.
    if (_musicGain) {
      try { _musicGain.gain.cancelScheduledValues(0); } catch { /* ignore */ }
      try { _musicGain.gain.setValueAtTime(getMusicBusTargetGain(), getCtx()?.currentTime ?? 0); } catch { /* ignore */ }
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
