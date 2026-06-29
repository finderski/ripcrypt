# AGENTS.md — RipCrypt FoundryVTT v14 Migration

## Project Goal

This repository contains an imported Foundry VTT v13 implementation of the RipCrypt game system.

The current goal is **not** to rebuild the system from scratch. The goal is to migrate the existing v13 codebase to **Foundry VTT v14 compliance** while preserving existing functionality, layout, data shape, packs, assets, and user workflows wherever practical.

## Target Platform

- Foundry VTT: v14
- Migration source: existing imported v13 RipCrypt system code
- Game rules source: RipCrypt Digital Core Rulebook v1.0
- Implementation authority: official Foundry VTT v14 API and Knowledge Base

When existing code, prior model knowledge, and Foundry v14 docs disagree, follow the current Foundry v14 documentation.

## Migration Principles

- Preserve working v13 behavior unless it conflicts with Foundry v14 requirements or the RipCrypt rules.
- Prefer small, reviewable migration steps.
- Do not perform broad rewrites unless required for v14 compatibility.
- Do not redesign the character sheet unless explicitly requested.
- Keep the imported visual layout where practical.
- Do not invent RipCrypt mechanics.
- If a rule or data field is unclear, document the question rather than guessing.
- Use public Foundry APIs. Avoid private/internal APIs.
- Avoid deprecated v9/v10/v11/v12/v13 patterns when a v14-compatible approach is available.
- Keep migration notes in `docs/v13-to-v14-audit.md`, `docs/data-migration-map.md`, `docs/testing.md`, or other relevant docs.

## Model Strategy for Codex

Use **5.4 Codex by default** for most implementation tasks.

Use 5.4 for:

- Manifest updates
- Documentation
- Localization cleanup
- CSS fixes
- Simple template changes
- Obvious import/path fixes
- Packs/compendium manifest cleanup
- README/CHANGELOG updates
- Straightforward console-error fixes

Escalate to **GPT-5.5-Codex High** only for high-risk work, including:

- v13-to-v14 architecture audit
- Mapping v13 data to v14 TypeDataModels
- Migration sequencing
- Initial TypeDataModel implementation
- First actor sheet migration
- First roll-mechanics migration
- Complex settings/hooks/init failures
- Stubborn DataModel, sheet lifecycle, embedded document, or cross-system bugs

## Required Reading Before Coding

Before making implementation changes, read:

- `AGENTS.md`
- `docs/project-brief.md`
- `docs/foundry-v14-authoring-standards.md`
- `docs/ripcrypt-foundry-v14-plan.md`
- Any task-specific audit/spec docs

For migration tasks, also read as applicable:

- `docs/v13-to-v14-audit.md`
- `docs/current-feature-inventory.md`
- `docs/data-migration-map.md`
- `docs/testing.md`

## Foundry v14 Standards

Follow the Foundry v14 authoring standards in:

- `docs/foundry-v14-authoring-standards.md`

In particular:

- Use v14-compatible system manifest patterns.
- Use `documentTypes` correctly in `system.json`.
- Use v14 Actor and Item document registration patterns.
- Use Foundry v14 `TypeDataModel` classes for Actor and Item system data.
- Register data models through `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels`.
- Keep calculated values in `prepareDerivedData()` where appropriate.
- Use localization keys for user-facing text.
- Keep roll logic separate from sheet rendering where practical.
- Test changes in Foundry v14.

## Coding Rules

- Keep changes small and focused.
- Do not rewrite large files unnecessarily.
- Do not introduce TypeScript, React, Vue, Tailwind, Bootstrap, or build tools unless requested.
- Preserve existing imports and file structure unless migration requires a change.
- If moving files, update all imports and manifest paths.
- Use clear, boring JavaScript ES modules.
- Prefix new CSS classes with `ripcrypt-`.
- Do not include copyrighted fonts or assets unless the project has the right to distribute them.

## After Each Coding Task

Summarize:

1. Files changed
2. Why they changed
3. Any v13-to-v14 compatibility issue addressed
4. How to test the change in Foundry v14
5. Any remaining risks or follow-up tasks