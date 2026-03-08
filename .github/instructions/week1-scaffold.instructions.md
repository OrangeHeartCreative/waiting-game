---
description: "Use when editing Phaser scene architecture, placeholder UI, preload flow, or Week 1 setup tasks in waiting-game. Captures preferred scaffold-only scope and scene-flow conventions."
applyTo: "src/**/*.js, tests/**/*.js, README.md, WEEK1_CHECKLIST.md"
---

# Week 1 Scaffold Preferences

- Apply these preferences during Week 1 scaffolding only.
- Prefer foundation-only scope: avoid gameplay mechanics, balancing, enemy AI, or deployment hosting work.
- Prefer preserving scene handoff order: `Boot -> Preload -> Menu -> Game`.
- Prefer keeping `MenuScene` and `GameScene` focused on static placeholder visuals and HUD anchors.
- Prefer loading assets through shared manifest/config files instead of ad-hoc hardcoded scene paths.
- Prefer narrow scene responsibilities to reduce coupling between systems.
- When architecture or flow changes, also update `README.md` and `WEEK1_CHECKLIST.md` to keep docs aligned.