## Plan: Next Session Checklist

Focused one-session plan based on the current README next milestone priorities.

**Session Goal**
- [ ] Expand playable depth without breaking current scene contracts.

**Execution Checklist**
1. Layout Expansion
- [ ] Add one additional level layout while preserving `Boot -> Preload -> Menu -> Game` flow.
- [ ] Verify player/rival spawn points remain valid in the new layout.
- [ ] Keep collision behavior readable and consistent with current movement feel.

2. Enemy Archetype Expansion
- [ ] Add one new rival behavior variant with clear on-screen readability.
- [ ] Keep behavior logic isolated so existing rivals continue to work unchanged.
- [ ] Confirm rival pressure remains fair and understandable.

3. Round Objectives and Balancing
- [ ] Add one richer round objective or rule modifier for delivery flow.
- [ ] Tune pacing values (timer pressure, score reward, or rival cadence) in small increments.
- [ ] Validate that success/fail reason labels remain accurate for all end states.

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
