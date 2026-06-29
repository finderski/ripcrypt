# RipCrypt FoundryVTT v14 Migration — Project Brief

## Project Summary

This project is a Foundry VTT system implementation for **RipCrypt**.

The repository now contains an imported **Foundry VTT v13** implementation of the RipCrypt game system. The current project goal is to migrate that existing codebase to **Foundry VTT v14 compliance** while preserving as much existing functionality, layout, content, and workflow as practical.

This is no longer a greenfield build.

## Primary Goal

Migrate the imported v13 RipCrypt system to a working Foundry VTT v14 system.

The migrated system should:

- Load cleanly in Foundry VTT v14.
- Allow creation and editing of RipCrypt Actors.
- Allow creation and editing of RipCrypt Items.
- Preserve the existing actor and item sheets where practical.
- Preserve existing rolls and chat-card behavior where practical.
- Preserve existing packs/compendia where practical.
- Preserve existing visual layout and styling where practical.
- Use v14-compatible APIs and package structure.
- Avoid unnecessary rewrites.

## Source Material

### Game Rules Source

- RipCrypt Digital Core Rulebook v1.0

### Codebase Source

- Imported Foundry-RipCrypt v13 system files.

### Foundry Implementation Source

Use the official Foundry VTT v14 API and Knowledge Base as the implementation authority.

Important references:

- https://foundryvtt.com/api/
- https://foundryvtt.com/kb/
- https://foundryvtt.com/article/intro-development/
- https://foundryvtt.com/article/system-development/
- https://foundryvtt.com/article/system-data-models/
- https://foundryvtt.com/article/module-development/
- https://foundryvtt.com/article/module-sub-types/
- https://foundryvtt.com/article/localization/

When existing code, model assumptions, and Foundry v14 documentation disagree, follow the Foundry v14 documentation.

## Migration Philosophy

The safest migration path is:

1. Understand what the imported v13 code already does.
2. Identify v13 patterns that break or are deprecated in v14.
3. Migrate the package manifest and initialization flow.
4. Migrate data models and document registration.
5. Migrate actor and item sheets.
6. Migrate rolls, chat cards, owned items, drag/drop, packs, settings, and localization.
7. Run Foundry v14 QA.
8. Polish and document the v14 migration.

Do not rebuild features from scratch unless migration is more expensive or riskier than replacement.

## Non-Goals

The current project is not trying to:

- Redesign the system UI from scratch.
- Rebuild the character sheet from scratch.
- Add large new automation features.
- Add new game mechanics not present in the rulebook.
- Convert the project to TypeScript.
- Add React, Vue, Tailwind, Bootstrap, or a build pipeline.
- Support Foundry versions older than v14.
- Repackage or redistribute content without confirming license requirements.

## Model Strategy for Codex

Use **5.4 Codex by default** for most tasks.

Use 5.4 for:

- Manifest updates.
- Documentation.
- Localization cleanup.
- CSS fixes.
- Simple template changes.
- Obvious import/path fixes.
- Packs/compendium manifest cleanup.
- README/CHANGELOG updates.
- Straightforward console-error fixes.

Escalate to **GPT-5.5-Codex High** only for high-risk work, including:

- v13-to-v14 architecture audit.
- Mapping v13 data to v14 TypeDataModels.
- Migration sequencing.
- Initial TypeDataModel implementation.
- First actor sheet migration.
- First roll-mechanics migration.
- Complex settings/hooks/init failures.
- Stubborn DataModel, sheet lifecycle, embedded document, or cross-system bugs.

## Initial Migration Milestones

### Milestone 1 — Audit and Migration Map

Produce:

- `docs/v13-to-v14-audit.md`
- `docs/current-feature-inventory.md`
- `docs/data-migration-map.md`

These should document what exists, what is broken or risky, and how current v13 data maps into v14.

### Milestone 2 — v14 Package Load

The system should appear in Foundry v14, create a world, and load without fatal errors.

### Milestone 3 — v14 Data and Documents

Actor and Item document types should be registered correctly, and system data should use v14-compatible TypeDataModels.

### Milestone 4 — Sheet Migration

Actor and Item sheets should render, save, reload, and preserve existing layout and workflows.

### Milestone 5 — Gameplay Workflows

Rolls, chat cards, owned items, drag/drop, packs, localization, and settings should work under v14.

### Milestone 6 — QA and Release Prep

Run a full Foundry v14 QA pass, document known issues, and prepare README/CHANGELOG updates for a v14 development release.

## Working Rules for Codex

Before coding, Codex should read:

- `AGENTS.md`
- `docs/project-brief.md`
- `docs/foundry-v14-authoring-standards.md`
- `docs/ripcrypt-foundry-v14-plan.md`
- Any task-specific audit/spec docs

Codex should keep changes small and focused.

After each coding task, Codex should summarize:

1. Files changed.
2. Why they changed.
3. Any v13-to-v14 compatibility issue addressed.
4. How to test the change in Foundry v14.
5. Any remaining risks or follow-up tasks.