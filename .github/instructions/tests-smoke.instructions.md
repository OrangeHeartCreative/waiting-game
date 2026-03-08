---
description: "Use when editing Week 1 smoke tests for scene boot, preload, and handoff flow in waiting-game. Captures preferred test scope and assertions for scaffold-only validation."
applyTo: "tests/**/*.js"
---

# Week 1 Smoke Test Preferences

- Apply these preferences during Week 1 scaffolding only.
- Prefer smoke coverage for scene lifecycle only, especially `Boot -> Preload -> Menu -> Game` handoff stability.
- Prefer testing for stable boot and transitions over mechanics, scoring, combat, or progression behavior.
- Prefer deterministic tests that avoid timing-sensitive flakiness and avoid coupling tests to visual pixel details.
- Prefer asserting placeholder contracts (scene keys, transition calls, scaffold UI existence) rather than gameplay state.
