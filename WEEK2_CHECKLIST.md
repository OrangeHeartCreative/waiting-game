## Plan: Week 2 Execution Checklist

Week 2 focuses on turning the scaffold into a stronger playable loop while keeping scene boundaries stable.

Note: This checklist is archived as completed. Continue with `FINAL_TASKS_CHECKLIST.md` for release-candidate work.

**Scope**
- [x] Add baseline gameplay mechanics in `GameScene`.
- [x] Replace placeholder transitions with real UI state handling.
- [x] Move visual placeholders to manifest-driven assets.
- [x] Expand mechanics depth (hazard variety, delivery pacing, round pressure).
- [x] Improve feedback and readability (UI messaging, clarity, feel).

**Current Baseline (Already Done)**
- [x] Waiter loop implemented (move, collect, deliver, avoid hazard).
- [x] 100-second timer and score-by-remaining-time behavior.
- [x] Round result payload (`score`, `delivered`, `reason`) passed back to `MenuScene`.
- [x] Menu result panel + retry state.
- [x] Manifest entries and placeholder gameplay assets wired.

**Execution Checklist**
1. Gameplay Iteration
- [x] Add at least one additional hazard pattern.
- [x] Add delivery difficulty scaling over time.
- [x] Add clear fail/success state messaging in-round.

2. UI and State Flow
- [x] Show previous-round summary consistently in menu.
- [x] Add clear "new run" reset behavior (all counters/time reset).
- [x] Add explicit round-end reason labels for all outcomes.
- [x] Keep active table states synchronized with the `NEXT` queue window.

3. Asset and Content Pipeline
- [x] Add next set of placeholder assets through `src/assets/manifest.js` only.
- [x] Keep scene code consuming asset keys instead of hardcoded paths.
- [x] Verify no scene rewrites are needed for asset swaps.

4. Quality Hardening
- [x] Extend smoke tests for round-end and result-state transitions.
- [x] Add deterministic tests for timer and scoring updates.
- [x] Keep `npm run lint`, `npm run test`, and `npm run build` green after each feature slice.

**Week 2 Validation Checklist**
- [x] Core loop remains playable and understandable.
- [x] Menu <-> Game transitions preserve state intent.
- [x] Manifest-driven assets load correctly in dev and build.
- [x] `npm run lint` passes.
- [x] `npm run test` passes.
- [x] `npm run build` passes.

**Out of Scope (Week 2)**
- [ ] Multiplayer/network features.
- [ ] Backend services/persistence.
- [ ] Final art/audio polish and release packaging.
