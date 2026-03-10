## Plan: Week 1 Execution Checklist (Primary)

Phaser + Vite + JavaScript foundation only. Gameplay mechanics are intentionally out of scope for this week.

Note: This checklist is archived for Week 1 completion tracking. The current repository state has progressed beyond Week 1 and now includes playable delivery flow and rival AI behavior systems.
Note: Current rival polish includes 4-direction patrol coverage, nearby buffered pursuit (without forced cut-off bumps), smoothed retargeting, and slower pacing.

**Scope**
- [x] Include setup, scene architecture, placeholder visuals/UI, preload conventions, lint/test/build, and docs.
- [x] Exclude mechanics, balancing, AI, and deployment hosting.

**Day-by-Day Checklist**
1. Day 1 - Bootstrap and tooling
- [x] Initialize Vite project and install Phaser.
- [x] Add scripts: `dev`, `build`, `preview`, `lint`, `test`.
- [x] Configure ESLint and Vitest baseline.
- [x] Verify app starts with `npm run dev`.

2. Day 2 - Architecture skeleton
- [x] Create folders: `src/game`, `src/scenes`, `src/ui`, `src/assets`.
- [x] Add `src/main.js` and `src/game/config.js`.
- [x] Stub `BootScene`, `PreloadScene`, `MenuScene`, `GameScene`.
- [x] Confirm clean run with scene stubs.

3. Day 3 - Scene lifecycle wiring
- [x] Wire `Boot -> Preload -> Menu -> Game` flow.
- [x] Add transition hooks/events (no gameplay logic).
- [x] Validate scene transitions are stable on reload.

4. Day 4 - Visual scaffolding
- [x] Add placeholder visual tokens (color/spacing/type constants).
- [x] Build static title/menu shell in `MenuScene`.
- [x] Build static HUD/layout placeholders in `GameScene`.

5. Day 5 - Asset/preload conventions
- [x] Add placeholder manifest-based preload pattern.
- [x] Organize placeholder assets with naming conventions.
- [x] Ensure scenes consume manifest/config, not hardcoded paths.

6. Day 6 - Quality hardening
- [x] Add smoke tests for boot and scene handoff.
- [x] Tighten lint rules (imports/dead code/module consistency).
- [x] Run and fix `npm run lint`, `npm run test`, `npm run build`.

7. Day 7 - Docs and milestone validation
- [x] Update `README.md` with setup, scripts, and architecture map.
- [x] Document week-2 mechanics entry points.
- [x] Complete final validation checklist below.

**Final Validation Checklist**
- [x] `npm run dev` launches with no runtime errors.
- [x] Scene flow works end-to-end with placeholders only.
- [x] Static menu and HUD placeholders render as expected.
- [x] `npm run lint` passes.
- [x] `npm run test` passes.
- [x] `npm run build` passes.

**Dependencies (Execution Order)**
- [x] Day 1 complete before all others.
- [x] Day 2 complete before Days 3-6.
- [x] Day 3 complete before most of Days 4-5.
- [x] Day 6 after Days 3-5.
- [x] Day 7 finalizes all deliverables.

**Daily Loop**
- [x] Start: run `npm run dev` and smoke scene transitions.
- [x] End: run `npm run lint` and `npm run test`.
- [x] Every other day (minimum): run `npm run build`.

**Risk Controls**
- [x] Use procedural/simple placeholders to avoid licensing risk.
- [x] Do not add mechanics early (protect scope).
- [x] Keep scene responsibilities narrow to avoid coupling.

**Week 2 Handoff**
- [x] Add mechanics in `GameScene` using existing HUD anchors.
- [x] Replace placeholder transitions with real UI state handling.
- [x] Swap placeholders via manifest changes, not scene rewrites.
