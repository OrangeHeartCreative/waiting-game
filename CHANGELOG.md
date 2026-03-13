# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] — 2026-03-13

### Released
- Finalized the post-1.0 polish pass and promoted the current playable build as the final release baseline.

### Changed
- Main menu title now uses a custom comic-style procedural logo treatment with layered arcade lettering.
- Shift complete screen now focuses on centered `SCORE` and `PLATES` stats (grade removed) for clearer summary readability.
- Day complete and shift/day UI styling has been tightened for stronger visual consistency with the arcade theme.
- Rival hit penalty indicator in HUD is larger and positioned directly beneath the timer for better readability.

### Fixed
- Gameplay systems now properly freeze while pause overlay is active (scene timing, tweening, and physics progression halted until resume).
- Delivery interaction now triggers on direct contact with the highlighted target seat location, improving consistency with seat collider expectations.

### Validation
- Local gates passing for release cut: `npm run lint`, `npm run test`, `npm run build`.

## [1.0.1] — 2026-03-13

### Fixed
- Seat callout queue now tracks previously announced seat labels and rerolls duplicates immediately when selecting the next target.
- HUD score alignment now grows rightward from a fixed anchor so scores with 4+ digits do not overlap the score icon.

### Validation
- Automated smoke coverage remains passing: `npm run test`.
- Production bundle build remains passing: `npm run build`.

### Packaging
- Produced an itch.io-ready ZIP package from the production build output.

## [1.0.0] — 2026-03-11

### Released
- Promoted the playable build from release-candidate status to the v1.0.0 release baseline.
- Finalized and validated the full release scope across gameplay flow, UI polish, procedural audio, and scene stability.

### Validation
- Manual smoke flow confirmed: `Boot -> Preload -> Menu -> Game -> ShiftComplete/DayComplete -> Game`.
- Manual stress validation passed with no observed unavoidable fail states from spawn overlap or routing deadlocks.
- Automated gates passing at release cut: `npm run lint`, `npm run test`, `npm run build`.

### Documentation
- Updated `README.md` release language and milestone status to v1.0.0.
- Updated `FINAL_TASKS_CHECKLIST.md` with fully completed in-scope release items.

## [1.0.0-rc2] — 2026-03-11

### Changed

**Audio Behavior**
- Menu background music is enabled with a playful/elegant procedural melody loop in `src/audio/AudioManager.js`.
- Gameplay retains the medium-loud bassline loop in `src/audio/AudioManager.js`.
- Transition to gameplay now hard-stops any scheduled menu notes before starting playfield music.
- Audio unlock resumes from menu input gestures so menu/game music and SFX start reliably after user interaction.

**Menu UX**
- Restored and stabilized `MenuScene` overlays:
  - Settings overlay (`S`) with master + SFX controls.
  - How to Play overlay (`H`) with graphical, icon-driven instruction cards.
- How to Play shifted from text-heavy block copy to visual step flow (pickup → deliver → avoid rivals) with pause/twist hints.

**Gameplay Visual Polish**
- Added a cohesive HUD icon pass for score, timer, target, and warning states.
- Added manifest-backed table sprite rendering with graceful vector fallback.
- Added micro-feedback cues in `GameScene`: pickup/delivery pulses, target-callout pulse, timer-warning pulse, and rival-hit flash/shake feedback.

### Fixed
- Resolved regression where SFX became silent after menu rollback due to AudioContext not being resumed on start input.
- Removed menu start transition delay so `ENTER` / `SPACE` returns to immediate game handoff.

### Tests
- Smoke coverage aligned with restored overlays and keyboard toggles.
- Current suite: 77 tests passing.

### Docs
- Updated `README.md` to reflect:
  - Menu melody + gameplay bassline music behavior.
  - Cohesive HUD icon and gameplay micro-feedback polish.
  - Graphical How to Play overlay.
- Updated `FINAL_TASKS_CHECKLIST.md` to mark completed polish items (manual validation, visual/icon pass, and micro-feedback pass).

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
