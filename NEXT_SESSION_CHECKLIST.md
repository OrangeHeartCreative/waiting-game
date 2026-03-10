## Plan: Next Session Checklist

Focused one-session plan based on the current README next milestone priorities.

**Today Kickoff (2026-03-10)**
- [x] Baseline quality check passed: `npm run lint`.
- [x] Baseline quality check passed: `npm run test`.
- [x] Baseline quality check passed: `npm run build`.
- [x] Dev server starts cleanly (`vite` on `http://localhost:5174/`; `5173` was already in use).
- [x] Manual smoke and tuning pass completed for rival movement and scene handoff stability.
- [x] Rival AI overhaul completed: deterministic, role-based patterns now react to player motion and cover the full playfield.

**Session Goal**
- [ ] Polish rival challenge/readability without breaking current scene contracts.

**Execution Checklist**
1. Rival Motion Tuning
- [ ] Run a focused playtest pass on all four rival roles for route readability and pressure.
- [ ] Fine-tune per-rival speed scales and influence thresholds (center/top-center first).
- [ ] Verify no rival stalls, twitches, or lane-edge bounce loops over a full round.

2. Challenge and Fairness
- [ ] Validate timer penalty cadence feels fair at close range.
- [ ] Confirm player has escape windows after rival body contact stun.
- [ ] Tune only constants first before introducing any new AI branches.

3. Layout Expansion (Next)
- [ ] Add one additional level layout while preserving `Boot -> Preload -> Menu -> Game` flow.
- [ ] Re-validate spawn safety and collision readability for both player and rivals.

4. Manifest Flow Validation
- [ ] Add or swap placeholder assets through `src/assets/manifest.js` only.
- [ ] Confirm scenes consume manifest keys, not hardcoded asset paths.
- [ ] Verify visual swaps work in dev and production build.

**Validation**
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Smoke the full scene loop and confirm summary handoff still works.

**Out of Scope**
- [ ] Multiplayer/network features.
- [ ] Backend persistence/services.
- [ ] Final release packaging and polish pass.
