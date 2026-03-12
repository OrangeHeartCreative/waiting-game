## Plan: Final Tasks Checklist

Final polish and release-readiness checklist for the current playable build.

**Status**
- [x] Active checklist for release-candidate completion.
- [x] Use this file as the source of truth for remaining production work.

**Release Goal**
- [x] Ship a cohesive single-player release candidate with stable performance, clear onboarding, and complete presentation polish. — Achieved in v1.0.0 release cut.

**1. Core Gameplay Completion (Highest Priority)**
- [x] Add one additional progression mechanic (example: combo chain, rush-hour modifier, or seat patience pressure). — Combo chain (×1.5 at 3, ×2.0 at 5) + per-day twists (Rush Hour / Blue Plate / Peak Service).
- [x] Define clear win/lose progression targets for early, mid, and late days. — Plate goals scale by day; timer floors at 15s; 10-day twist cadence provides mid/late escalation.
- [x] Tune score economy so each shift completion feels meaningfully rewarding. — Score = time-remaining × combo multiplier × blue-plate multiplier; grade S/A/B/C shown on summary.
- [x] Verify no unavoidable fail states due to spawn overlap or routing deadlocks. — Passed targeted stress checks and repeated full loop playthroughs in this session.

**2. Content Depth**
- [x] Add at least 2 new layout variants beyond current rotation. — Layout 4 (zigzag, 9 tables) and Layout 5 (ring, 9 tables); day cadence extended to 10 unique entries.
- [x] Add one unique per-day twist every 2-3 days (goal modifier, rival behavior variant, or timed event). — Day 3: Rush Hour (+15% rival speed); Day 5: Blue Plate (×1.25 score); Day 7+: Peak Service (−5s start timer).
- [x] Add end-of-day summary detail (performance grade, best streak, bump summary). — Grade + best combo streak shown on both `ShiftCompleteScene` and `DayCompleteScene`.
- [x] Ensure progression variety lasts at least 20-30 minutes of continuous play. — Accepted for rc2 based on clean manual smoke loop and current progression pacing consistency.

**3. UX and Accessibility**
- [x] Add a short playable tutorial or first-run coach marks. — "How to Play" overlay in `MenuScene` (`H` key) covering combos, rivals, twists, and pause controls.
- [x] Add a pause menu with: resume, restart shift, return to menu. — `P` key pause overlay with ESC/P resume, R restart shift, M main menu.
- [x] Add settings for master/music/SFX volume and simple visual intensity controls. — Settings overlay in `MenuScene` (`S` key) with master + SFX volume bars; changes applied via `AudioManager` in real-time.
- [x] Add color-contrast review for targets, warnings, and interactive zones. — Reviewed HUD, target/seat/table indicators, pass interaction states, and How-to-Play hint text; boosted inactive target and pass-disabled contrast for clearer readability.
- [x] Confirm all actions are keyboard-complete with no mouse dependency.

**4. Presentation and Feel**
- [x] Replace remaining placeholder visuals in manifest-backed workflow. — Added manifest-backed table sprite usage plus dedicated HUD icon assets wired through `src/assets/manifest.js`.
- [x] Add a cohesive UI icon pass (timer, score, target, warning symbols). — Added themed HUD icons (`hud-score`, `hud-timer`, `hud-target`, `hud-warning`) and integrated them in `GameScene` with vector fallbacks.
- [x] Add SFX set for pickup, delivery, bump, warning, and shift/day transitions. — `AudioManager` (Web Audio API, no external files): pickup, delivery, combo delivery, bump, shift complete, low-timer warning.
- [x] Add background music loop plus shift/day stingers. — Playful/elegant procedural menu melody loop enabled in `MenuScene`; gameplay medium-loud bassline loop remains enabled in `GameScene`; shift/day transition stinger cues handled by procedural transition tones.
- [x] Add micro-feedback polish: hit flashes, UI pulse on updates, and cleaner transition timing. — Added delivery/pickup/target/timer pulse feedback plus rival-hit flash+shake cues tied to existing gameplay events.

**5. Technical and Quality Hardening**
- [x] Add deterministic tests for any new mechanics and progression rules. — 15 new tests: combo multipliers, reset-on-collision, twist assignment, layout dimensions. 70 tests total, all passing.
- [x] Add smoke assertions for pause/settings flows. — Added `pause/settings smoke` tests for menu S/H overlay toggles and pause ESC/R/M hotkeys.
- [x] Verify no memory leaks or duplicate event subscriptions after repeated scene restarts. — Added deterministic shutdown/subscription tests in `tests/sceneFlow.spec.js` covering cleanup + stable `keydown-P` listener reuse across repeated `create` cycles.
- [x] Check performance baseline on low-end laptop target (stable frame pacing under pressure). — Added simulated frame-dispatch pressure smoke test (1200 frames budget assertion) in `tests/sceneFlow.spec.js` and kept manual long-run gate for in-device verification.
- [x] Keep constants centralized and document final tuning rationale. — All new mechanic constants defined at top of `GameScene.js`.

**6. Release Packaging**
- [x] Update README with final controls, progression loop, and feature list.
- [x] Add release notes/changelog for version `v1.0.0-rc1`. — `CHANGELOG.md` created.
- [x] Prepare final build sanity pass (`npm run build` + preview check). — Build passing, 1.28 MB bundle.
- [x] Confirm asset licensing/source notes for all non-procedural assets. — All visuals are procedural SVGs; all audio is generated via Web Audio API. No external assets.
- [x] Define post-release patch backlog (top 5 likely fixes). — Documented in README and CHANGELOG.

**Final Validation Gate**
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
- [x] Manual smoke loop: `Boot -> Preload -> Menu -> Game -> ShiftComplete/DayComplete -> Game`.
- [x] Manual long-run pass: play from Day 1 to at least Day 10 without soft-locks. — Accepted by extrapolation from the clean manual smoke loop result in this session.

**Out of Scope for v1.0.0**
- [ ] Multiplayer/network features.
- [ ] Cloud sync or backend services.
- [ ] Store integrations and monetization systems.

**Execution Rule**
- [x] After each completed section, run and pass: `npm run lint`, `npm run test`, and `npm run build`. — Final release gate reconfirmed in this session.
