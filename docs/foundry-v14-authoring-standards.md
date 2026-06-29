# Foundry VTT v14 Authoring Standards for RipCrypt

## Purpose

This document defines how Codex should approach Foundry VTT v14 development for the RipCrypt system.

The project is a **v13-to-v14 migration**, not a from-scratch rebuild.

The goal is to preserve existing behavior while bringing the codebase into compliance with Foundry VTT v14.

## Official References

Use the official Foundry VTT v14 documentation as the implementation authority.

Important references:

- https://foundryvtt.com/api/
- https://foundryvtt.com/kb/
- https://foundryvtt.com/article/intro-development/
- https://foundryvtt.com/article/system-development/
- https://foundryvtt.com/article/system-data-models/
- https://foundryvtt.com/article/module-development/
- https://foundryvtt.com/article/module-sub-types/
- https://foundryvtt.com/article/localization/

When the imported v13 code conflicts with Foundry v14 documentation, prefer the v14 documentation.

## Migration Standard

Do not rebuild the system from scratch.

Prefer this order:

1. Understand existing v13 behavior.
2. Document existing behavior.
3. Identify v14 incompatibilities.
4. Make the smallest safe change.
5. Test in Foundry v14.
6. Document remaining risks.

## Package Manifest Standards

The root `system.json` is the package manifest and must be v14-compatible.

Check:

- `id`
- `title`
- `description`
- `version`
- `compatibility`
- `authors`
- `esmodules`
- `scripts`, if still needed
- `styles`
- `packs`
- `languages`
- `documentTypes`
- `socket`
- `initiative`
- `grid`
- `primaryTokenAttribute`
- `secondaryTokenAttribute`
- `url`
- `manifest`
- `download`

Prefer ES modules through `esmodules`.

Avoid adding new legacy `scripts` unless required by existing code and verified in v14.

## Folder and File Standards

Preserve the imported repo structure unless migration requires changes.

If new files are added, prefer clear locations such as:

```text
module/
  documents/
  data/
  sheets/
  dice/
  helpers/
templates/
  actor/
  item/
styles/
lang/
packs/
docs/
```

Do not perform broad cosmetic restructuring during migration.

If files move, update:

- import paths
- `system.json`
- template references
- pack references
- documentation

## Document Type Standards

Actor and Item subtypes must be declared in `system.json` under `documentTypes`.

Use the existing imported actor and item types unless there is a clear reason to rename them.

Do not rename actor or item types casually, because that may break existing world data and compendium content.

If renaming is unavoidable, document the migration risk.

## Data Model Standards

Use Foundry v14 `TypeDataModel` classes for Actor and Item `system` data.

Required practices:

- Use `foundry.abstract.TypeDataModel`.
- Use `foundry.data.fields`.
- Register models through `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels`.
- Preserve the existing v13 data shape where practical.
- Define schemas explicitly.
- Keep user-editable values in the schema.
- Keep calculated values in `prepareDerivedData()` where appropriate.
- Use `prepareBaseData()` only for base normalization needed before derived calculations.

Avoid:

- Random undeclared system fields.
- Large speculative schema rewrites.
- Changing field names unless required.
- Storing derived values if they can be calculated safely.

## Actor Standards

Preserve existing Actor types where possible.

For each Actor type:

- Identify current v13 fields.
- Map fields to v14 DataModel schema.
- Preserve existing sheet behavior.
- Preserve existing roll behavior.
- Preserve existing token/resource behavior where practical.

Do not create new Actor types unless needed.

## Item Standards

Preserve existing Item types where possible.

For each Item type:

- Identify current v13 fields.
- Map fields to v14 DataModel schema.
- Preserve existing sheet behavior.
- Preserve owned item behavior.
- Preserve drag/drop behavior where practical.

Do not create new Item types unless needed.

## Sheet Standards

Migrate existing actor and item sheets to v14-compatible patterns.

Required practices:

- Preserve existing layout where practical.
- Preserve existing workflows.
- Keep sheet logic in sheet classes where practical.
- Keep rule mechanics separate from template rendering where practical.
- Use localization keys for user-facing labels.
- Avoid broad redesigns during migration.
- Test field persistence after every sheet migration.

Avoid:

- Rebuilding the sheet from scratch.
- Replacing the visual design without approval.
- Introducing frameworks.
- Depending on private/internal Foundry APIs.
- Making large template rewrites before the data model is stable.

## Event and Update Standards

When migrating sheet behavior:

- Use public Foundry document update APIs.
- Preserve existing event behavior where practical.
- Avoid unnecessary jQuery-heavy rewrites.
- Keep event handlers focused and testable.
- Confirm values persist after closing and reopening sheets.

Test:

- simple text fields
- numeric fields
- checkboxes
- selects
- repeatable sections
- embedded item controls
- roll buttons
- drag/drop behavior

## Roll and Chat Standards

Preserve existing RipCrypt roll behavior unless it conflicts with the rulebook.

Required practices:

- Keep roll logic separate from sheet rendering where practical.
- Use v14-compatible Roll and ChatMessage APIs.
- Localize user-facing chat-card text.
- Document assumptions in `docs/ripcrypt-mechanics-spec.md`.
- Validate against the RipCrypt rulebook.

Avoid:

- Changing mechanics without documentation.
- Silently changing target numbers, success logic, damage logic, or resource costs.
- Hard-coding labels in chat cards when localization is practical.

## Localization Standards

Use language files in `lang/`.

Required practices:

- Keep existing localization keys where practical.
- Use the `RIPCRYPT` namespace for new keys if that matches the existing convention.
- Localize sheet labels, buttons, chat labels, warnings, and tooltips where practical.
- Confirm language files load in Foundry v14.

Avoid:

- Renaming many keys unnecessarily.
- Moving every hard-coded string in one large risky pass.
- Changing visible terminology away from the rulebook.

## CSS and Layout Standards

Preserve the imported visual layout where practical.

Required practices:

- Keep CSS changes focused.
- Fix v14 rendering issues.
- Fix overflow.
- Fix unreadable contrast.
- Fix window sizing issues.
- Prefix new CSS classes with `ripcrypt-` unless following an existing project convention.
- Do not add external CSS frameworks.

Avoid:

- Full visual redesign.
- Copyrighted fonts unless distribution rights are confirmed.
- Large CSS rewrites before sheet functionality works.

## Packs and Compendium Standards

Preserve existing packs where practical.

Required practices:

- Ensure pack definitions are v14-compatible.
- Ensure packs appear in Foundry v14.
- Ensure entries open.
- Do not rewrite content unless required.
- Document any content migration risk.

Avoid:

- Changing pack names without need.
- Deleting pack content.
- Rebuilding packs before verifying whether existing packs work.

## Settings, Hooks, and Initialization Standards

Use the correct Foundry lifecycle phase for each operation.

Audit:

- settings registration
- CONFIG assignment
- DataModel registration
- document class registration
- sheet registration
- template preloading
- Handlebars helper registration
- ready-time world operations

Avoid:

- Doing setup too late.
- Doing world-dependent operations too early.
- Depending on private Foundry internals.
- Registering the same hook or helper multiple times.

## Testing Standards

After meaningful changes, test in Foundry v14.

At minimum:

1. Launch Foundry v14.
2. Confirm the system appears.
3. Create/open a RipCrypt world.
4. Create a character actor.
5. Open the character sheet.
6. Edit fields.
7. Close and reopen the sheet.
8. Confirm data persists.
9. Create items.
10. Open item sheets.
11. Add owned items.
12. Test drag/drop if supported.
13. Make rolls.
14. Confirm chat cards render.
15. Check browser console errors.

Update `docs/testing.md` when adding or fixing behavior.

## Codex Model Strategy

Use **5.4 Codex by default**.

Use 5.4 for:

- manifest changes
- docs
- localization
- CSS
- small template fixes
- packs
- README/CHANGELOG
- simple console errors

Use **GPT-5.5-Codex High** for:

- architecture audit
- data migration map
- migration sequence
- first TypeDataModel implementation
- first actor sheet migration
- first roll migration
- complex initialization failures
- stubborn cross-system bugs

## After Each Task

Codex should summarize:

1. Files changed.
2. Why they changed.
3. What v13-to-v14 issue was addressed.
4. How to test in Foundry v14.
5. Remaining risks or follow-up tasks.