## Plan: Next Session Checklist

Polish, balance, and content-expansion session plan for the current playable prototype.

**Session Goal**
- [ ] Improve long-run pacing and readability while keeping scene flow stable.

**Execution Checklist**
1. Difficulty Curve Polish
- [ ] Playtest through at least Day 8 and record fail points by day/shift.
- [ ] Tune day-scaling constants to hit a target "average fail day" (for example Day 6-10).
- [ ] Add a soft-cap or taper for plate-goal growth if late days become impossible too abruptly.
- [ ] Re-check rival bump fairness (lock-on, escape windows, recovery routing) under high-speed late days.

2. Content Expansion
- [ ] Add one new table layout variant (Layout 3) with distinct routing pressure.
- [ ] Update day-to-layout cadence so layouts rotate predictably without immediate repetition.
- [ ] Validate spawn safety and rival route quality on all layouts.

3. Readability and UX
- [ ] Add a compact on-screen "Day / Shift / Goal" run card at round start (short fade-out).
- [ ] Ensure in-world hints remain readable during high-rival pressure moments.
- [ ] Verify keyboard-only controls are consistent across `Menu`, `ShiftComplete`, and `DayComplete` scenes.

4. Balance Instrumentation
- [ ] Add lightweight debug counters/logging for: average delivery time, bump count, time-up reasons.
- [ ] Capture one balance snapshot per day for first 10 days.
- [ ] Convert findings into constant-tuning updates only (avoid major AI rewrites unless required).

5. Asset and Presentation Pass
- [ ] Swap one placeholder visual via `src/assets/manifest.js` to confirm replacement workflow still holds.
- [ ] Run a final visual sanity check for table/seat contrast and active-target clarity.

**Validation**
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Manual smoke pass: `Boot -> Preload -> Menu -> Game -> ShiftComplete/DayComplete -> Game`.

**Out of Scope**
- [ ] Multiplayer/network features.
- [ ] Backend persistence/services.
- [ ] Final release packaging/store submission.
