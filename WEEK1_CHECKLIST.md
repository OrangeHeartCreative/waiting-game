## Plan: Week 1 Execution Checklist (Primary)

Phaser + Vite + JavaScript foundation only. Gameplay mechanics are intentionally out of scope for this week.

**Scope**
- [x] Include setup, scene architecture, placeholder visuals/UI, preload conventions, lint/test/build, and docs.
- [x] Exclude mechanics, balancing, AI, and deployment hosting.

**Day-by-Day Checklist**
1. Day 1 - Bootstrap and tooling
- [ ] Initialize Vite project and install Phaser.
- [ ] Add scripts: `dev`, `build`, `preview`, `lint`, `test`.
- [ ] Configure ESLint and Vitest baseline.
- [ ] Verify app starts with `npm run dev`.

2. Day 2 - Architecture skeleton
- [ ] Create folders: `src/game`, `src/scenes`, `src/ui`, `src/assets`.
- [ ] Add `src/main.js` and `src/game/config.js`.
- [ ] Stub `BootScene`, `PreloadScene`, `MenuScene`, `GameScene`.
- [ ] Confirm clean run with scene stubs.

3. Day 3 - Scene lifecycle wiring
- [ ] Wire `Boot -> Preload -> Menu -> Game` flow.
- [ ] Add transition hooks/events (no gameplay logic).
- [ ] Validate scene transitions are stable on reload.

4. Day 4 - Visual scaffolding
- [ ] Add placeholder visual tokens (color/spacing/type constants).
- [ ] Build static title/menu shell in `MenuScene`.
- [ ] Build static HUD/layout placeholders in `GameScene`.

5. Day 5 - Asset/preload conventions
- [ ] Add placeholder manifest-based preload pattern.
- [ ] Organize placeholder assets with naming conventions.
- [ ] Ensure scenes consume manifest/config, not hardcoded paths.

6. Day 6 - Quality hardening
- [ ] Add smoke tests for boot and scene handoff.
- [ ] Tighten lint rules (imports/dead code/module consistency).
- [ ] Run and fix `npm run lint`, `npm run test`, `npm run build`.

7. Day 7 - Docs and milestone validation
- [ ] Update `README.md` with setup, scripts, and architecture map.
- [ ] Document week-2 mechanics entry points.
- [ ] Complete final validation checklist below.

**Final Validation Checklist**
- [ ] `npm run dev` launches with no runtime errors.
- [ ] Scene flow works end-to-end with placeholders only.
- [ ] Static menu and HUD placeholders render as expected.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.

**Dependencies (Execution Order)**
- [ ] Day 1 complete before all others.
- [ ] Day 2 complete before Days 3-6.
- [ ] Day 3 complete before most of Days 4-5.
- [ ] Day 6 after Days 3-5.
- [ ] Day 7 finalizes all deliverables.

**Daily Loop**
- [ ] Start: run `npm run dev` and smoke scene transitions.
- [ ] End: run `npm run lint` and `npm run test`.
- [ ] Every other day (minimum): run `npm run build`.

**Risk Controls**
- [ ] Use procedural/simple placeholders to avoid licensing risk.
- [ ] Do not add mechanics early (protect scope).
- [ ] Keep scene responsibilities narrow to avoid coupling.

**Week 2 Handoff**
- [ ] Add mechanics in `GameScene` using existing HUD anchors.
- [ ] Replace placeholder transitions with real UI state handling.
- [ ] Swap placeholders via manifest changes, not scene rewrites.
