# RipCrypt FoundryVTT v14 Migration Plan

## Current Direction

This project is migrating an imported **Foundry VTT v13** RipCrypt system to **Foundry VTT v14**.

This is not a rebuild. Preserve the existing actor types, item types, data paths, sheet layout, packs, assets, settings, and user workflows wherever practical. Replace code only when the v13 implementation is incomplete, broken in v14, dependent on private/internal APIs, or contradicted by the RipCrypt rules.

## Planning Inputs

This plan is based on:

- `docs/v13-to-v14-audit.md`
- `docs/current-feature-inventory.md`
- `docs/data-migration-map.md`
- `docs/foundry-v14-authoring-standards.md`
- Foundry VTT v14 API and Knowledge Base guidance for system manifests, document sub-types, `TypeDataModel`, localization, sheets, dice, and public API use.

Key conclusions from the audit documents:

- The codebase is already close to modern Foundry patterns: ES modules, ApplicationV2-style sheets, and `foundry.abstract.TypeDataModel` classes are already present.
- There is no root `template.json`; do not add one unless Foundry v14 testing proves it is required.
- The highest-priority blockers are manifest compatibility, missing pack declarations, `htmlFields` metadata, data-field validation, and pack build state.
- The highest-risk runtime areas are combat/token turn-marker overrides, custom dice replacement, protected ApplicationV2 overrides, and item DataModel lifecycle hooks.
- Preserve current `system.*` field names. The existing actor/item data paths are the migration contract unless a v14 blocker requires a targeted migration.

## Safety Rules

1. Make one migration layer work before touching the next layer.
2. Prefer manifest and registration fixes before sheet or gameplay fixes.
3. Preserve existing persisted data paths and pack source fields.
4. Do not redesign sheets during v14 compatibility work.
5. Keep derived values derived: actor `aura`, `limit`, `speed`, `guts.max`, equipment getters, and defense should not become persisted fields.
6. Avoid private/internal Foundry APIs. If a protected override remains necessary, isolate it and document why.
7. Test in Foundry v14 after each meaningful phase and record results in `docs/testing.md`.
8. Do not use the rules PDF to invent mechanics. Use it only to clarify behavior already present or explicitly requested.

## Phase 01 - Audit And Planning

Status: **complete**

Preferred model: **GPT-5.5-Codex High** for architecture, data mapping, and sequence decisions.

Deliverables:

- `docs/v13-to-v14-audit.md`
- `docs/current-feature-inventory.md`
- `docs/data-migration-map.md`
- Updated `docs/ripcrypt-foundry-v14-plan.md`

No implementation code changes in this phase.

## Phase 02 - Minimal v14 Package Load

Goal: make Foundry v14 recognize and load the system with the smallest possible package-level changes.

Preferred model: **5.4 Codex**

Escalate to **GPT-5.5-Codex High** only if package load failures are caused by data-model registration, initialization order, or undocumented manifest behavior.

### 02.01 - Update `system.json` compatibility

Tasks:

- Update `compatibility` away from v13-only.
- Remove the v13 `maximum: 13` cap.
- Set v14-appropriate `minimum` and `verified` values.
- Fix the release manifest URL so it points to `system.json`, not `module.json`.
- Leave `download` as a packaging task unless a real release archive URL exists.

Do not touch module code in this step.

Test:

- Foundry v14 lists the system as installable/usable.
- Foundry does not reject the package due to compatibility metadata.

### 02.02 - Resolve manifest pack blockers

Tasks:

- Remove or temporarily disable `skills` and `geist` pack declarations unless matching pack directories/source are added intentionally.
- Preserve existing `protection` and `weapons` pack declarations.
- Keep existing pack names for real packs to avoid breaking references.
- Decide whether generated pack databases are committed or built during release packaging.

Rationale:

- `protection` and `weapons` source exists.
- `skills` and `geist` are declared but missing on disk.
- Missing packs should not block initial v14 smoke testing.

Test:

- Foundry v14 world load does not emit missing-pack manifest errors.
- Existing real packs still appear if built.

### 02.03 - Add HTML field metadata

Tasks:

- Add `documentTypes.Item.good.htmlFields = ["description"]`.
- Add `documentTypes.Item.skill.htmlFields = ["description"]`.
- Add `documentTypes.Item.craft.htmlFields = ["description"]`.

Rationale:

- `GoodData`, `SkillData`, and `CraftData` use `fields.HTMLField` for `system.description`.
- v14 system manifest `documentTypes` metadata should identify HTML fields for server-side handling.

Test:

- Good, skill, and craft items can be created.
- Rich text descriptions persist and reopen without validation or sanitization errors.

### 02.04 - Verify package style and token defaults

Tasks:

- Verify the current object-form `styles` entry loads in v14.
- Convert to a simple string path only if v14 rejects the current shape.
- Consider adding manifest token defaults for `guts` only after actor trackable attributes are verified.

Test:

- System CSS loads.
- Dark theme remains intact.
- No token resource defaults are changed before actor data is verified.

### 02.05 - Create the first v14 smoke test log

Deliverable:

- `docs/testing.md`

Record:

- Foundry v14 version tested.
- System load result.
- World creation result.
- Fatal console errors.
- Missing pack warnings.
- Actor/item creation status if package load reaches that point.

## Phase 03 - Initialization And Data Models

Goal: validate the existing v13 TypeDataModel implementation under v14 before changing sheets.

Preferred model: **GPT-5.5-Codex High** for the first data-model pass.

Use **5.4 Codex** for small follow-up schema corrections once the pattern is proven.

### 03.01 - Confirm init registration order

Tasks:

- Verify settings, data models, document classes, sheets, sockets, components, and Handlebars helpers register during the correct lifecycle phase.
- Keep `CONFIG.Actor.dataModels.*` and `CONFIG.Item.dataModels.*` registration during `init`.
- Keep `CONFIG.Item.documentClass = RipCryptItem` initially.
- Avoid combat/token document changes in this phase unless they prevent package load.

Test:

- `hero` and `geist` actor types are valid.
- All declared item types are valid.
- Creating an actor or item does not fail during system data preparation.

### 03.02 - Validate actor models

Tasks:

- Keep `HeroData`, `GeistData`, and `EntityData`.
- Preserve `system.ability.*`, `system.guts.value`, `system.coin.*`, `system.fate`, and `system.level.*`.
- Keep `system.guts.max`, `system.aura`, `system.limit`, and `system.speed` derived.
- Verify `CONFIG.Actor.trackableAttributes.hero`.
- Decide whether `CONFIG.Actor.trackableAttributes.geist` should mirror hero after confirming geist behavior.

Known risks:

- `guts.max` is derived, not schema-declared.
- Token resource behavior must confirm derived `value`/`max` objects work as expected.
- `thin-glim` is a skill ability choice, not an actor ability field.

Test:

- Create a hero and a geist.
- Confirm ability defaults, guts defaults, fate defaults, and level defaults.
- Confirm derived speed/aura/limits display once sheets are open.
- Confirm token resource bars do not error.

### 03.03 - Validate item models

Tasks:

- Keep existing item model classes and field names.
- Validate `StringField` choice syntax for access, weight, armour location, skill ability, rank, and craft aspect.
- Convert `options` to v14-valid `choices` only where runtime validation proves it is needed.
- Validate `SetField` cleaning from arrays for weapon traits and armour/shield locations.
- Keep item `flags.ripcrypt.favourited` as flags, not system data.

Known risks:

- Current pack source stores SetField data as arrays.
- Custom `<string-tags>` controls must submit values that clean correctly.
- Weapon and armour lifecycle hooks on TypeDataModels may require v14 signature fixes.

Test:

- Create every item type: `ammo`, `armour`, `craft`, `good`, `shield`, `skill`, `weapon`.
- Save and reopen each item.
- Validate nullable cost/range/weight fields.
- Validate traits and locations.

### 03.04 - Add targeted data migrations only if needed

Tasks:

- Do not write a world migration unless v14 rejects existing source data.
- If old craft items include stale `system.ability`, ignore or drop it through a targeted `migrateData` path.
- If pack arrays fail `SetField` validation, add the narrowest data cleaning needed.

Test:

- Existing pack source imports cleanly.
- Existing test actors/items in a development world load without data loss.

## Phase 04 - Sheets And Field Persistence

Goal: preserve current sheet layout and workflows while making forms reliable in v14.

Preferred model: **GPT-5.5-Codex High** for the first actor sheet migration.

Use **5.4 Codex** for repeated template, label, and simple persistence fixes after the first pattern works.

### 04.01 - Verify sheet registration and rendering

Tasks:

- Confirm `CombinedHeroSheet`, `StatsCardV1`, `SkillsCardV1`, and `CraftCardV1` register for current actor types.
- Confirm `AllItemSheetV1` and `ArmourSheet` register for current item types.
- Confirm the current `themes` registration option is v14-compatible.
- Keep existing templates and CSS structure.

Test:

- Open each actor sheet for hero and geist where registered.
- Open each item sheet.
- Check the browser console after each open.

### 04.02 - Fix actor sheet persistence defects

Tasks:

- Fix actor coin inputs to submit `system.coin.gold`, `system.coin.silver`, and `system.coin.copper`.
- Fix the fate empty option builder so it submits the intended empty string value.
- Preserve current actor field paths for name, fate, level, abilities, and guts.
- Do not rename `system.coin.*` or `system.fate`.

Test:

- Edit actor name, fate, glory, step, rank, abilities, guts, and coins.
- Close and reopen the sheet.
- Confirm all values persist.

### 04.03 - Verify item sheet persistence

Tasks:

- Confirm `AllItemSheetV1` dynamic fields from `getFormFields()` submit correctly.
- Confirm `ArmourSheet._processFormData()` still filters armour locations correctly.
- Confirm embedded-only `system.equipped` fields behave as expected.
- Confirm rich text edit paths update `system.description`.

Test:

- Edit and persist every user-editable item field listed in `docs/data-migration-map.md`.
- Test world items and owned items.
- Test rich text descriptions for good, skill, and craft.

### 04.04 - Reduce protected ApplicationV2 dependence only where it breaks

Tasks:

- Smoke-test existing protected overrides first.
- Replace protected overrides only when v14 behavior fails or a public v14 API provides an obvious equivalent.
- Prioritize `_processSubmitData`, `_processFormData`, `_insertElement`, `_updatePosition`, and `_tearDown` only if runtime evidence requires it.

Test:

- Re-render sheets after field changes.
- Open duplicate sheet windows if current workflow supports it.
- Confirm popovers and context menus remain usable.

## Phase 05 - Owned Items, Packs, And Compendia

Goal: preserve existing item workflows and make real pack content usable in v14.

Preferred model: **5.4 Codex**

Escalate to **GPT-5.5-Codex High** if failures involve embedded document lifecycle or TypeDataModel validation.

### 05.01 - Owned item workflows

Tasks:

- Preserve actor-sheet create/edit/delete workflows.
- Preserve UUID-based edit and foreign update helpers.
- Preserve favourite ammo flags.
- Preserve equip prompts and equip-limit behavior for weapons, armour, and shields.

Test:

- Create owned weapons, armour, shields, ammo, goods, skills, and crafts.
- Edit owned items from actor sheets.
- Delete owned items from actor sheets.
- Update favourite ammo quantities through the Skills card and AmmoTracker.
- Equip and unequip gear, including invalid equip attempts.

### 05.02 - Build and validate real packs

Tasks:

- Build `protection` and `weapons` through the existing pack workflow after data models validate.
- Keep `_stats.coreVersion` updates tied to intentional v14 pack rebuilds.
- Do not create placeholder `skills` or `geist` packs just to satisfy the manifest.

Test:

- Packs appear in v14.
- Pack folders/categories open.
- Pack item entries open.
- Import pack items into the world.
- Drop or add pack items to actors if Foundry/default behavior supports it.

### 05.03 - Confirm drag/drop scope

Tasks:

- Do not invent custom drag/drop behavior.
- Preserve Foundry default document drops where they already work.
- Document unsupported drops instead of building speculative workflow code.

Test:

- Drop world items onto actors.
- Drop compendium items onto actors.
- Confirm failures are clean and do not corrupt actor data.

## Phase 06 - Rolls, Dice, Chat, And Gameplay

Goal: preserve current RipCrypt roll workflows without changing mechanics silently.

Preferred model: **GPT-5.5-Codex High** for the first roll mechanics pass.

Use **5.4 Codex** for chat labels, template cleanup, and obvious API fixes after roll behavior is confirmed.

### 06.01 - Validate custom dice behavior

Tasks:

- Confirm `CryptDie` works in v14.
- Confirm replacing `CONFIG.Dice.terms.d` remains intentional and does not break non-RipCrypt rolls in this system.
- Verify `Xd8rcT` formulas.
- Verify Haste `1d8xo=1`.
- Verify custom modifiers, explosion, success counting, totals, and roll tooltips.

Test:

- Roll ability checks through DicePool.
- Roll Haste from Delve Dice HUD and actor sheet controls.
- Inspect roll results and tooltips.
- Confirm no dice parser errors appear.

### 06.02 - Chat output

Tasks:

- Keep default Foundry roll cards unless a custom RipCrypt card is explicitly needed.
- Remove or document the unused `templates/chat/roll.hbs` placeholder when cleanup begins.
- Localize visible chat flavor text where practical, including Haste.
- Fix DicePool speaker handling if `this.actor` is undefined at runtime.

Test:

- Chat messages render.
- Roll tooltips are readable.
- Speaker attribution is correct or gracefully generic.

### 06.03 - Settings, sockets, and HUD

Tasks:

- Verify `dc`, `sandsOfFate`, `currentFate`, `whoFirst`, and related settings persist.
- Verify `ui.delveDice` creation and render timing.
- Verify socket namespace `system.ripcrypt`.
- Keep socket payload changes minimal and targeted.

Test:

- GM and player clients load without HUD errors.
- Haste rolls update Sands of Fate only when settings allow it.
- Notifications work for allowed levels.

## Phase 07 - Combat And Token Turn Markers

Goal: migrate the riskiest gameplay code after core actors, items, sheets, and rolls are already stable.

Preferred model: **GPT-5.5-Codex High**

Rationale:

- Combat/token code uses protected or internal-looking APIs.
- Changes here can affect turn order, token rendering, combat tracker behavior, and world state.

Tasks:

- Audit v14 `Combat`, `Combatant`, `Token`, and turn-marker APIs before editing.
- Preserve fate-driven initiative and friendly/hostile tie-break behavior.
- Replace private/internal API usage where public alternatives exist.
- Keep any necessary protected overrides isolated and documented.
- Confirm `_onCreate`, `_onDelete`, `nextTurn`, `previousTurn`, `_sortCombatants`, and turn marker refresh signatures against v14.

Test:

- Create combat with friendly and hostile tokens.
- Confirm fate-based initiative order.
- Test next/previous turn controls.
- Test grouped turns.
- Test token turn marker rendering.
- Check console after every combat operation.

## Phase 08 - Localization, CSS, Assets, And Cleanup

Goal: clean user-facing rough edges after behavior works.

Preferred model: **5.4 Codex**

### 08.01 - Localization cleanup

Tasks:

- Keep existing `RipCrypt` and `TYPES.*` localization keys.
- Add missing keys only as needed.
- Replace hard-coded visible strings in low-risk passes.
- Fix the `Occured` typo during localization cleanup.
- Prefer namespaced system keys over ambiguous generic keys such as `Name`.

Test:

- Language file loads in v14.
- Actor/item create dialogs show localized type names.
- Sheet labels, setting labels, notifications, and chat labels resolve.

### 08.02 - CSS and layout fixes

Tasks:

- Preserve the imported dark theme and sheet composition.
- Fix v14 window sizing, overflow, unreadable text, or stale selectors found during QA.
- Remove or correct stale light-theme claims only after confirming no active light theme exists.
- Do not add external CSS frameworks.

Test:

- Open all sheets and apps at normal and narrow sizes.
- Confirm no critical controls overlap or disappear.
- Confirm local SVG and CSS asset fetches work in v14.

### 08.03 - Dead placeholder cleanup

Tasks:

- Remove stale or placeholder files/declarations only after behavior is stable.
- Candidate cleanup includes unused chat template, commented non-functional settings, `.DS_Store`, and stale README light-theme claims.

Test:

- Re-run the full smoke checklist after cleanup.

## Phase 09 - Full v14 QA And Release Prep

Goal: prove the migrated system is ready for a v14 development release.

Preferred model: **5.4 Codex**

Escalate to **GPT-5.5-Codex High** for stubborn cross-system failures.

Deliverables:

- Updated `docs/testing.md`
- `docs/v14-known-issues.md`, if unresolved issues remain
- README/CHANGELOG/release notes updates when requested

Full QA checklist:

- System appears in Foundry v14 setup.
- A RipCrypt world can be created and launched.
- Browser console has no fatal startup errors.
- `ui.delveDice` renders for GM and non-GM clients.
- Create `hero` and `geist` actors.
- Open Combined Hero Sheet, Stats Card, Skills Card, and Craft Card.
- Edit actor name, fate, glory, step, rank, abilities, guts, and coins.
- Close and reopen actor sheets; confirm values persist.
- Create every item type.
- Open every item sheet.
- Edit item fields, close, reopen, and confirm persistence.
- Add owned items to actors.
- Equip weapons, armour, and shields; confirm prompts and constraints.
- Use actor context menus to edit/delete embedded items.
- Test favourite ammo popover and foreign quantity updates.
- Run DicePool ability rolls.
- Run Haste checks.
- Confirm chat messages render and roll tooltips are readable.
- Build and open compendium packs.
- Import pack items.
- Test supported item drops.
- Create combat with hero and geist tokens.
- Test grouped turn order, next/previous turn, and turn markers.
- Verify localization and settings.
- Document known issues with reproduction steps.

## Model Escalation Rules

Use **5.4 Codex** for:

- Manifest edits.
- Documentation.
- Localization cleanup.
- CSS fixes.
- Simple template changes.
- Obvious import/path fixes.
- Pack manifest cleanup.
- README/CHANGELOG updates.
- Straightforward console-error fixes.

Use **GPT-5.5-Codex High** for:

- v13-to-v14 architecture decisions.
- DataModel migration and validation.
- First actor sheet migration.
- First roll mechanics migration.
- Combat/token turn-marker migration.
- Complex settings/hooks/init failures.
- Stubborn DataModel, sheet lifecycle, embedded document, or cross-system bugs.

Escalate when:

- A change risks saved data.
- A bug crosses multiple systems.
- Foundry v14 documentation must be interpreted carefully.
- A protected/private API replacement is non-obvious.
- Debugging stalls after one focused 5.4 attempt.

## Definition Of Done

The migration is ready for a v14 development release when:

- Foundry v14 recognizes the system.
- A world can be created.
- Existing actor types can be created.
- Existing item types can be created.
- Actor sheets open and save.
- Item sheets open and save.
- Existing rolls work or documented replacements exist.
- Chat output renders.
- Real packs are visible and usable.
- Localization loads.
- Browser console has no blocking errors.
- Known issues are documented.
- README includes v14 install/testing notes.
