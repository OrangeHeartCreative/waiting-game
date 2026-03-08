---
description: "Use when editing Phaser scenes in Week 1 of waiting-game. Captures preferred scene responsibilities, lifecycle boundaries, and scaffold-only architecture conventions."
applyTo: "src/scenes/**/*.js, src/game/**/*.js"
---

# Week 1 Phaser Scene Structure Preferences

- Apply these preferences during Week 1 scaffolding only.
- Prefer one clear responsibility per scene: boot/setup in `BootScene`, asset loading in `PreloadScene`, static menu shell in `MenuScene`, static HUD/layout shell in `GameScene`.
- Prefer keeping lifecycle methods focused and short, with setup and transition intent easy to trace.
- Prefer central scene keys/constants over repeated string literals where practical.
- Prefer manifest/config-based asset references over scene-local hardcoded paths.
- Prefer transition wiring that preserves `Boot -> Preload -> Menu -> Game` unless a documented Week 1 task requires otherwise.
