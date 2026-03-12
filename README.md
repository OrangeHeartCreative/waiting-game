# Dumb Waiters!

HTML5 game built with Phaser 3 and Vite.

## Documentation Index

- Current project overview: `README.md`
- Week 1 archive: `WEEK1_CHECKLIST.md`
- Week 2 archive: `WEEK2_CHECKLIST.md`
- Last polish session archive: `NEXT_SESSION_CHECKLIST.md`
- Final stretch plan: `FINAL_TASKS_CHECKLIST.md`

## Current Scope

This repository currently provides a playable v1.0.0 release on top of the Week 1 scaffold:
- Scene lifecycle (`Boot -> Preload -> Menu -> Game -> ShiftComplete / DayComplete`)
- Playable waiter loop in `GameScene`:
	- Move with `WASD`/arrow keys
	- Collect at `PASS` and deliver to the chef-announced, highlighted seat
	- First chef callout waits 3 seconds, then each order timer starts only after the callout and movement toward `PASS`
	- Per-order timer scales by day: starts at `30s`, decreases by `2.5s` per day, floored at `15s`
	- Plate objective scales by day with taper: starts at `10`, increases by `+5` up to Day 6 pace, then tapers to `+2` per day
	- Score gained from remaining time when a seat is served
	- Total score is cumulative across shifts and days
	- Round-start run card briefly shows `Day / Shift / Goal`
	- Chef speech bubble callouts announce each target table/seat
	- Cleared layouts route through `ShiftCompleteScene`; every completed day routes through `DayCompleteScene`
- Rival waiter pressure system:
	- Rivals follow role-based patrol scripts with distinct movement styles (left/center/right/top-center)
	- Deterministic waypoint paths now sweep across the full playfield (top/mid/bottom and side-to-side) while preserving role-based behavior
	- Waypoint progression reacts to player movement direction while staying deterministic (no random chase picks)
	- Nearby rivals shift into buffered pursuit (approach with standoff distance) instead of hard cut-off blocking
	- Pursuit retargeting is smoothed with hysteresis, timed retarget windows, and blended targets to reduce jitter
	- Rival movement speed is intentionally toned down to keep motion readable and natural
	- Rival contact applies a `-1.5s` timer penalty on cooldown
	- Rival body contact stuns rivals briefly to create escape windows
	- Bumped rivals enter cooldown + recovery routing to reduce sticky lock-on behavior
	- Rival/player contact now applies a small rival bounceback nudge to reduce sticky body overlap
- Presentation and UI pass:
	- Main menu, in-game HUD, and completion scenes use a stronger arcade/SNES-inspired visual treatment
	- Gameplay HUD now uses cohesive iconography for score, timer, target, and warning states
	- Completion scenes use framed card layouts and keyboard-forward continue prompts
	- End-of-shift/day summary shows performance grade (S/A/B/C) and best combo streak
	- Pause overlay (P key) with resume / restart shift / main menu options
	- HUD remains black-backed in gameplay for maximum readability and layering clarity
	- Menu includes Settings overlay (volume controls) and a graphical How to Play overlay (icon cards)
	- Micro-feedback polish added: delivery/pickup pulses, timer warning pulse, and rival-hit flash/shake cues
- Maze collision and movement tuning:
	- Top/bottom/side boundary walls are collidable
	- Kitchen/pass counter and table/seat colliders block movement
	- Axis-separated collision resolution allows sliding around seat nodes
- Spawn safety:
	- Player spawn is randomized from open maze points
	- Spawn bias favors points farther from rival starts
	- Spawn selection rejects blocked/table-overlap points
- Stateful menu transition handling:
	- `GameScene` sends round summary data (`score`, `delivered`, `reason`, `reasonLabel`) back to `MenuScene`
	- `MenuScene` renders summary and supports shift restart flow
- Stateful layout/day transition handling:
	- `GameScene` sends within-day layout clears to `ShiftCompleteScene`
	- `GameScene` sends completed days to `DayCompleteScene`
	- `ShiftCompleteScene` continues to the next shift within the same day
	- `DayCompleteScene` starts the next day on the alternate playfield layout
- Playfield layout rotates on a non-repeating 10-day cadence across five variants (three originals + zigzag + ring)
	- Per-day gameplay twists:
		- **Rush Hour** (Day 3): all rivals move 15% faster
		- **Blue Plate** (Day 5): every delivery scores ×1.25
		- **Peak Service** (Day 7+): shift timer starts 5 seconds shorter
	- Combo chain scoring:
		- Chain 3+ deliveries without getting bumped → **×1.5 multiplier**
		- Chain 5+ deliveries → **×2.0 multiplier**
		- Blue Plate and combo multipliers stack multiplicatively
		- Rival contact immediately resets the combo counter
	- Queue-linked activation:
	- Internal queue progression drives the currently active seat target
	- Queue generation is constrained to selected queue tables for each run
	- Deliveries consume queue entries and refresh chef callouts plus active seat/table highlights
- Manifest-driven visual placeholders:
	- Placeholder sprites load from `src/assets/manifest.js` via `PreloadScene`
	- `GameScene` consumes manifest keys (player/table placeholders)
	- HUD icons (`hud-score`, `hud-timer`, `hud-target`, `hud-warning`) now load from the manifest
	- `plate` now uses an alternate placeholder asset to validate swap workflow
	- Visual swaps can be done by changing manifest paths without scene rewrites
- Balance instrumentation:
	- Round-level snapshots log for days 1-10 with delivery pacing, bump count, and round-end reason
- Procedural audio:
	- `AudioManager` generates all SFX via Web Audio API (no external audio files required)
	- Sounds: pickup, delivery, combo delivery, rival bump, shift complete, low-timer warning
	- Background music: playful/elegant procedural menu melody loop plus gameplay medium-loud bassline loop
	- Per-session volume controls (master + SFX) accessible from the main menu
- Lint/test/build baseline with scene smoke coverage (77 tests)

## Controls

- Keyboard: `WASD` or arrow keys
- Menu start/retry: `ENTER` or `SPACE`
- `ESC`: return from `GameScene` to `MenuScene`
- `P`: toggle pause mid-game
  - `ESC` / `P`: resume
  - `R`: restart current shift from pause
  - `M`: return to main menu from pause
- `S` (Menu): open Settings overlay (volume controls)
- `H` (Menu): open How to Play overlay
- Shift/day continue: `SPACE`
- Shift/day menu exit: `ESC`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production bundle locally
- `npm run lint` - Lint JavaScript source files
- `npm run test` - Run smoke tests
- `npm run capture:screenshots` - Capture an itch.io screenshot pack (requires dev server running)

## Itch.io Screenshot Pack

Automated screenshot capture is available for store-ready images.

1. Start the game server:
	- `npm run dev`
2. In a second terminal, run:
	- `npm run capture:screenshots`
3. Output files are written to:
	- `marketing/itchio-screenshots/`

Generated filenames:
1. `01-main-menu.png`
2. `02-how-to-play.png`
3. `03-settings.png`
4. `04-gameplay-hud.png`
5. `05-pause-menu.png`
6. `06-gameplay-action.png`

Optional: set a custom target URL if needed:
- `SCREENSHOT_URL=http://127.0.0.1:5173 npm run capture:screenshots`

## Structure

- `src/main.js` - Phaser entrypoint and scene registration
- `src/game/config.js` - Shared resolution/scaling config
- `src/scenes/` - Scene classes and keys
- `src/audio/AudioManager.js` - Procedural Web Audio API SFX (no external files)
- `src/ui/tokens.js` - Visual design tokens for placeholders
- `src/assets/manifest.js` - Asset loading manifest
- `tests/` - Baseline smoke tests

## Architecture Map

Scene handoff and responsibilities:
- `BootScene` - Minimal startup handoff into preload
- `PreloadScene` - Manifest-driven asset registration/loading
- `MenuScene` - Start/retry entry and round summary display
- `GameScene` - Playable service maze loop, collision, chef-guided seat targeting, and rival systems
- `ShiftCompleteScene` - Inter-shift summary and within-day handoff
- `DayCompleteScene` - End-of-day summary and next-day handoff

Flow:
1. `BootScene -> PreloadScene`
2. `PreloadScene -> MenuScene`
3. `MenuScene -> GameScene` (`ENTER` / `SPACE`)
4. `GameScene -> ShiftCompleteScene` (shift clear within a day)
5. `GameScene -> DayCompleteScene` (day clear after shift `3/3`)
6. `ShiftCompleteScene -> GameScene` (next shift)
7. `DayCompleteScene -> GameScene` (next day)
8. `GameScene -> MenuScene` (time-up or `ESC`)

## Release Status

Current local validation gate is passing:
1. `npm run lint`
2. `npm run test`
3. `npm run build`

## Milestone

v1.0.0 success criteria — all passing:
1. App boots and scene flow is stable.
2. Placeholder menu and HUD render correctly.
3. Combo chain, day twists, pause, settings, and how-to-play functional.
4. Procedural SFX fires on key game events; menu melody loop and gameplay bassline loop are active.
5. Performance grade (S/A/B/C) shown on shift/day complete screens.
6. `lint`, `test`, and `build` all pass.

## Asset Licensing

All visual assets in `public/assets/placeholders/` are procedurally generated SVG rectangles and shapes — no external artwork or licensed assets are used at this stage. Audio is generated entirely via the Web Audio API.

## Post-Release Patch Backlog

Top candidates for next iteration:
1. Replace placeholder sprites with final artwork via `src/assets/manifest.js`
2. Add persistent high-score tracking (localStorage)
3. Mobile touch / virtual joystick support
4. Introduce day-specific music tracks via AudioManager
5. Expand rival AI with patrol variety per twist type
