## Plan: Final Tasks Checklist

Final polish and release-readiness checklist for the current playable build.

**Status**
- [ ] Active checklist for release-candidate completion.
- [ ] Use this file as the source of truth for remaining production work.

**Release Goal**
- [ ] Ship a cohesive single-player release candidate with stable performance, clear onboarding, and complete presentation polish.

**1. Core Gameplay Completion (Highest Priority)**
- [ ] Add one additional progression mechanic (example: combo chain, rush-hour modifier, or seat patience pressure).
- [ ] Define clear win/lose progression targets for early, mid, and late days.
- [ ] Tune score economy so each shift completion feels meaningfully rewarding.
- [ ] Verify no unavoidable fail states due to spawn overlap or routing deadlocks.

**2. Content Depth**
- [ ] Add at least 2 new layout variants beyond current rotation.
- [ ] Add one unique per-day twist every 2-3 days (goal modifier, rival behavior variant, or timed event).
- [ ] Add end-of-day summary detail (performance grade, best streak, bump summary).
- [ ] Ensure progression variety lasts at least 20-30 minutes of continuous play.

**3. UX and Accessibility**
- [ ] Add a short playable tutorial or first-run coach marks.
- [ ] Add a pause menu with: resume, restart shift, return to menu.
- [ ] Add settings for master/music/SFX volume and simple visual intensity controls.
- [ ] Add color-contrast review for targets, warnings, and interactive zones.
- [ ] Confirm all actions are keyboard-complete with no mouse dependency.

**4. Presentation and Feel**
- [ ] Replace remaining placeholder visuals in manifest-backed workflow.
- [ ] Add a cohesive UI icon pass (timer, score, target, warning symbols).
- [ ] Add SFX set for pickup, delivery, bump, warning, and shift/day transitions.
- [ ] Add background music loop plus shift/day stingers.
- [ ] Add micro-feedback polish: hit flashes, UI pulse on updates, and cleaner transition timing.

**5. Technical and Quality Hardening**
- [ ] Add deterministic tests for any new mechanics and progression rules.
- [ ] Add smoke assertions for pause/settings flows.
- [ ] Verify no memory leaks or duplicate event subscriptions after repeated scene restarts.
- [ ] Check performance baseline on low-end laptop target (stable frame pacing under pressure).
- [ ] Keep constants centralized and document final tuning rationale.

**6. Release Packaging**
- [ ] Update README with final controls, progression loop, and feature list.
- [ ] Add release notes/changelog for version `v1.0.0-rc1`.
- [ ] Prepare final build sanity pass (`npm run build` + preview check).
- [ ] Confirm asset licensing/source notes for all non-procedural assets.
- [ ] Define post-release patch backlog (top 5 likely fixes).

**Final Validation Gate**
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Manual smoke loop: `Boot -> Preload -> Menu -> Game -> ShiftComplete/DayComplete -> Game`
- [ ] Manual long-run pass: play from Day 1 to at least Day 10 without soft-locks.

**Out of Scope for v1.0.0**
- [ ] Multiplayer/network features.
- [ ] Cloud sync or backend services.
- [ ] Store integrations and monetization systems.

**Execution Rule**
- [ ] After each completed section, run and pass: `npm run lint`, `npm run test`, and `npm run build`.
