# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-rc2] — 2026-03-11

### Changed

**Audio Behavior**
- Background music scope narrowed to gameplay only.
- Menu background music is disabled.
- Gameplay uses a medium-loud bassline loop in `src/audio/AudioManager.js`.
- Audio unlock now resumes from the menu start input gesture so SFX reliably play during gameplay.

**Menu UX**
- Restored and stabilized `MenuScene` overlays:
  - Settings overlay (`S`) with master + SFX controls.
  - How to Play overlay (`H`) with graphical, icon-driven instruction cards.
- How to Play shifted from text-heavy block copy to visual step flow (pickup → deliver → avoid rivals) with pause/twist hints.

### Fixed
- Resolved regression where SFX became silent after menu rollback due to AudioContext not being resumed on start input.
- Removed menu start transition delay so `ENTER` / `SPACE` returns to immediate game handoff.

### Tests
- Smoke coverage aligned with restored overlays and keyboard toggles.
- Current suite: 77 tests passing.

### Docs
- Updated `README.md` to reflect:
  - Gameplay-only bassline music policy.
  - Graphical How to Play overlay.
- Updated `FINAL_TASKS_CHECKLIST.md` to mark the background loop/stinger item as complete for current scope.

## [1.0.0-rc1] — 2025-07-13

### Added

**Audio**
- `src/audio/AudioManager.js` — procedural Web Audio API sound effects with no external files
  - Sounds: pickup, delivery, combo delivery, rival bump, shift complete, low-timer warning
  - Master volume and SFX volume controls with per-session persistence
  - Graceful no-op in non-browser (test/build) environments

**Gameplay: Combo Chain Scoring**
- Chain 3+ consecutive deliveries without a rival collision → score multiplier ×1.5
- Chain 5+ consecutive deliveries → score multiplier ×2.0
- Combo counter resets on any rival contact
- Best combo streak tracked per shift; displayed on summary screens
- Combo flash indicator shown in HUD on active combo tiers

**Gameplay: Per-Day Twists**
- Day 3 — **Rush Hour**: all rival waiters move 15% faster
- Day 5 — **Blue Plate Special**: every delivery scores ×1.25 (stacks with combo multiplier)
- Day 7, 8, 9, 10 — **Peak Service**: shift timer starts 5 seconds shorter
- Day-twist badge displayed in HUD each round
- Twist cadence: days 1, 2, 4, 6 have no twist

**Gameplay: New Table Layouts**
- Layout 4 — zigzag pattern (9 tables, alternating left/right alignment)
- Layout 5 — ring pattern (9 tables arranged around a central open space)
- Day cadence extended to 10 unique days: `[0, 1, 2, 1, 3, 4, 0, 2, 3, 1]`

**Gameplay: Pause System**
- `P` key toggles pause at any point during a shift
- Pause overlay shows: PAUSED title + ESC/P resume, R restart shift, M main menu hints
- `update()` loop skips all processing while paused

**End-of-Shift / End-of-Day Summary Screens**
- Performance grade (S / A / B / C) calculated from score relative to expected output
- Best combo streak shown alongside grade on `ShiftCompleteScene` and `DayCompleteScene`

**Menu: Settings Overlay (`S` key)**
- Master volume and SFX volume bars with ↑ ↓ row selection, ← → adjustment
- Volume changes call `AudioManager` immediately for real-time feedback
- Stored in session-scoped module constant

**Menu: How to Play Overlay (`H` key)**
- Bullet-list summary of core mechanics: deliveries, combos, rivals, daily twists, pause controls
- Accessible at any time from the main menu; closes with `H` or `ESC`

**Controls Additions**
- `P` — pause / resume during a shift
- `R` — restart current shift (from pause overlay)
- `M` — return to main menu (from pause overlay)
- `S` — open Settings overlay (main menu)
- `H` — open How to Play overlay (main menu)

### Fixed
- Removed duplicate `const grade` / `const comboLine` block in `ShiftCompleteScene.js` that caused a `SyntaxError` at import time

### Tests
- 15 new tests covering combo multipliers, reset-on-collision, twist assignment, day-twist labels, and new layout dimensions
- Total: 70 tests, all passing
- All tests verified against ESLint (clean) and Vite build (clean)

### Asset Licensing
- All visual assets remain procedurally generated SVG placeholders — no external licensing required
- All audio generated via Web Audio API — no external audio files

---

## [0.9.0] — Week 2 Prototype

Initial playable prototype with scene flow, rival waiter system, scoring, and placeholder UI.
See `WEEK2_CHECKLIST.md` for full feature list.
