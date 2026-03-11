# Waiting Game

HTML5 game built with Phaser 3 and Vite.

## Current Scope

This repository currently provides a playable prototype on top of the Week 1 scaffold:
- Scene lifecycle (`Boot -> Preload -> Menu -> Game -> ShiftComplete / DayComplete`)
- Playable waiter loop in `GameScene`:
	- Move with `WASD`/arrow keys
	- Collect at `PASS` and deliver to the chef-announced, highlighted seat
	- First chef callout waits 3 seconds, then each order timer starts only after the callout and movement toward `PASS`
	- Per-order timer scales by day: starts at `30s`, decreases by `2.5s` per day, floored at `15s`
	- Plate objective scales by day: starts at `10` deliveries and increases by `+5` per day
	- Score gained from remaining time when a seat is served
	- Total score is cumulative across shifts and days
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
	- Playfield layout alternates by day to reduce route memorization
	- Queue-linked activation:
	- Internal queue progression drives the currently active seat target
	- Queue generation is constrained to selected queue tables for each run
	- Deliveries consume queue entries and refresh chef callouts plus active seat/table highlights
- Manifest-driven visual placeholders:
	- Placeholder sprites load from `src/assets/manifest.js` via `PreloadScene`
	- `GameScene` consumes manifest keys (player/table placeholders)
	- Visual swaps can be done by changing manifest paths without scene rewrites
- Lint/test/build baseline with scene smoke coverage

## Controls

- Keyboard: `WASD` or arrow keys
- Menu start/retry: `ENTER` or `SPACE`
- `ESC`: return from `GameScene` to `MenuScene`
- Shift/day continue: `SPACE`
- Shift/day menu exit: `ESC`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production bundle locally
- `npm run lint` - Lint JavaScript source files
- `npm run test` - Run smoke tests

## Structure

- `src/main.js` - Phaser entrypoint and scene registration
- `src/game/config.js` - Shared resolution/scaling config
- `src/scenes/` - Scene classes and keys
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

## Prototype Status

Current local validation gate is passing:
1. `npm run lint`
2. `npm run test`
3. `npm run build`

## Milestone

Week 1 success criteria:
1. App boots and scene flow is stable.
2. Placeholder menu and HUD render correctly.
3. `lint`, `test`, and `build` all pass.

## Next Milestone

Prototype polish and content expansion:
1. Add at least one new layout variant and improve day-to-day layout cadence.
2. Tune long-run difficulty curve (timer/goal/speed) for survivability targets.
3. Add richer round modifiers/objectives beyond pure plate count.
4. Keep manifest-driven art replacement flow for final assets.
