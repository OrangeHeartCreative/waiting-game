# Waiting Game

HTML5 game scaffold built with Phaser 3 and Vite.

## Current Scope

This repository currently provides architecture and visual scaffolding only:
- Scene lifecycle (`Boot -> Preload -> Menu -> Game`)
- Static UI/HUD placeholders
- Asset manifest pattern for future real assets
- Lint and test baseline

Gameplay mechanics are intentionally not implemented yet.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production bundle locally
- `npm run lint` - Lint JavaScript source files
- `npm run test` - Run smoke tests

## Structure

- `src/main.js` - Phaser entrypoint and scene registration
- `src/game/config.js` - Shared resolution/scaling config
- `src/scenes/` - Scene classes and keys
- `src/ui/tokens.js` - Visual design tokens for placeholders
- `src/assets/manifest.js` - Asset loading manifest
- `tests/` - Baseline smoke tests

## Milestone

Week 1 success criteria:
1. App boots and scene flow is stable.
2. Placeholder menu and HUD render correctly.
3. `lint`, `test`, and `build` all pass.
