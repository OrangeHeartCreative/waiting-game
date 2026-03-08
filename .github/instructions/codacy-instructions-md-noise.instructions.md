---
description: "Use when running Codacy analysis for instruction markdown files in waiting-game. Handles known Python analyzer false positives on .instructions.md frontmatter."
applyTo: ".github/instructions/*.instructions.md"
---

# Codacy Markdown Noise Handling

- For `.instructions.md` files, treat `Pylint` `syntax-error` findings at line 1 caused by YAML frontmatter (`---`) as non-actionable false positives.
- Still treat all non-`Pylint` findings, and any `Pylint` findings beyond frontmatter parsing, as actionable and fix them.
- Keep running `codacy_cli_analyze` after edits to instruction files; only downgrade this specific known noise pattern.
