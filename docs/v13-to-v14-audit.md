# RipCrypt v13 to v14 Compatibility Audit

Date: 2026-06-29

Scope: imported Foundry VTT v13 RipCrypt system currently in this repository. This audit is documentation only and does not change implementation files.

Official v14 references reviewed:

- https://foundryvtt.com/api/
- https://foundryvtt.com/article/intro-development/
- https://foundryvtt.com/article/system-development/
- https://foundryvtt.com/article/system-data-models/
- https://foundryvtt.com/article/module-development/
- https://foundryvtt.com/article/module-sub-types/
- https://foundryvtt.com/article/localization/

Project references reviewed:

- `AGENTS.md`
- `docs/project-brief.md`
- `docs/foundry-v14-authoring-standards.md`
- `docs/ripcrypt-foundry-v14-plan.md`

## Executive Summary

This repository already contains a relatively modern v13 implementation. It uses ES modules, v14-style `foundry.applications.*` classes in many sheets and apps, and explicit `foundry.abstract.TypeDataModel` classes for actor and item `system` data. This lowers migration risk compared with a legacy `template.json`/`ActorSheet` system.

The main remaining v14 breakpoints are:

- The imported file layout is unconventional, but most of it is internally consistent. Broad folder moves would create high churn for little v14 value.
- Some item schemas appear to use `options` instead of `choices` on `StringField`, which needs v14 field validation testing.
- Actor data model derived properties such as `aura`, `limit`, and `speed` are not declared schema fields. Derived data is allowed, but these values must be tested with v14 data preparation and token/resource handling.
- Combat and token behavior relies on protected/internal APIs such as `_updateTurnMarkers`, `_refreshTurnMarker`, `token._object`, and `CONFIG.Combat.settings.turnMarker`.
- Custom elements write to `CONFIG.CACHE.componentListeners`, which appears internal and should be replaced or verified in v14.
- Some sheet and app overrides use protected ApplicationV2 methods such as `_processSubmitData`, `_processFormData`, `_updatePosition`, and `_insertElement`.
- Localization is present and mostly namespaced, but several visible strings remain hard-coded or call missing keys such as `Name`.
- Actor coin fields render as fixed zero values without `name` attributes, so they do not persist from the current sheet.
- The chat roll template is a placeholder and is not currently wired into roll output.

Package-load blockers already addressed in the current working tree:

- `system.json` now declares Foundry v14 compatibility instead of v13-only compatibility.
- The manifest URL now points to `system.json` instead of `module.json`.
- Missing `skills` and `geist` pack declarations were removed from the manifest.
- `documentTypes.Item.good`, `.skill`, and `.craft` now declare `htmlFields: ["description"]`.

No Foundry v14 runtime test was performed as part of this audit.

## Current Repository Shape

Important entry points:

- Manifest: `system.json`
- Main module: `module/main.mjs`
- Init hook: `module/hooks/init.mjs`
- Ready hook: `module/hooks/ready.mjs`
- Data models: `module/data/Actor/*.mjs`, `module/data/Item/*.mjs`
- Document overrides: `module/documents/*.mjs`
- Actor sheets: `module/Apps/ActorSheets/*.mjs`
- Item sheets: `module/Apps/ItemSheets/*.mjs`
- Other apps: `module/Apps/DicePool.mjs`, `module/Apps/DelveDiceHUD.mjs`, `module/Apps/RichEditor.mjs`
- Templates: `templates/Apps/**/*.hbs`, `templates/components/*.hbs`, `templates/chat/roll.hbs`
- Localization: `langs/en-ca.json`
- Packs: `packs/protection/_source`, `packs/weapons/_source`
- Assets: `assets/**/*.svg`, `assets/turn-marker.png`

Approximate inventory:

- 71 module `.mjs` files.
- 55 template/CSS files.
- 67 compendium source JSON files.
- No root `template.json`.

Structural normalization review:

- No file or folder moves were made in this pass.
- `module/Apps`, `templates/Apps`, `templates/css`, and `langs/` were retained as-is.
- These paths are unconventional compared with Foundry examples, but they are used consistently by imports, `filePath(...)`, custom element asset fetches, and manifest entries.
- Renaming or moving them now would create broad churn across imports, templates, CSS fetch paths, and documentation without addressing a confirmed v14 blocker.
- The current recommendation is to keep the imported layout stable until runtime QA identifies a concrete maintenance or compatibility problem that requires relocation.

## Package Manifest

File: `system.json`

Current state:

- `id` is `ripcrypt`, matching the folder name.
- `title`, `description`, `version`, `authors`, `esmodules`, `styles`, `languages`, `documentTypes`, `packs`, `packFolders`, and `socket` are present.
- `compatibility` is now v14:
  - `minimum`: `14`
  - `verified`: `14`
- `manifest` points to `.../releases/latest/download/system.json`.
- `download` is intentionally omitted until a real release archive URL exists.
- `bugs` now points to the GitHub issues URL instead of an empty string.
- `styles` uses v13 schema object form:
  - `{ "src": "templates/css/main.css", "layer": "system" }`
- `documentTypes.Item.good`, `.skill`, and `.craft` now declare `htmlFields: ["description"]`.
- Only real packs currently on disk are declared in the manifest:
  - `protection`
  - `weapons`
- No `initiative`, `grid`, `primaryTokenAttribute`, or `secondaryTokenAttribute` manifest defaults are declared.

v14 compatibility findings:

- Good: the manifest is no longer capped at v13 and should be recognized by Foundry v14 as compatible.
- Good: the manifest URL now points at `system.json`, which is correct for a system package.
- Acceptable for development: `download` is omitted until a real release archive exists.
- Verify: v14 `BaseSystem` schema supports package fields including `styles`, `documentTypes`, `packs`, `packFolders`, `initiative`, `grid`, and token attributes. The current style object shape should be checked against v14 runtime loading. The v14 system development article still shows string-array `styles`, while the API exposes a schema-backed styles array.
- Migration task: add or intentionally omit `initiative`, `grid`, `primaryTokenAttribute`, and `secondaryTokenAttribute`. Current runtime code sets token trackable attributes, but manifest token defaults would help new actors/tokens.

Recommended manifest sequence:

1. Verify `styles` object form in v14. If v14 rejects it, convert to a simple string path.
2. Decide whether to add manifest-level token defaults for `guts`.
3. Add a real `download` URL when release packaging exists.

## Scripts and Modules

Files:

- `module/main.mjs`
- `module/hooks/init.mjs`
- `module/hooks/ready.mjs`
- `module/hooks/hotReload.mjs`
- `scripts/buildCompendia.mjs`
- `scripts/extractCompendia.mjs`
- `scripts/linkFoundry.mjs`

Current state:

- `module/main.mjs` imports init, ready, hot reload, and public API setup.
- `module/hooks/init.mjs` performs settings registration, data model registration, document override registration, sheet registration, sockets, components, and Handlebars helpers.
- `module/hooks/ready.mjs` renders the custom delve dice HUD, sets dev conveniences, and performs a one-time core combat tracker setting update.
- Dev scripts use `@foundryvtt/foundryvtt-cli` for pack extraction/building.

v14 compatibility findings:

- Good: ES module entry is straightforward and v14-compatible in principle.
- Good: data models are registered during `init`, matching v14 guidance.
- Verify: `const { Items, Actors } = foundry.documents.collections` and `Actors.registerSheet`/`Items.registerSheet` are still documented in v14 through collection wrappers, so the pattern is acceptable, but each sheet class and option should still be smoke-tested.
- Risk: `CONFIG.ui.delveDice = DelveDiceHUD` plus `ui.delveDice.render({ force: true })` assumes Foundry will instantiate the custom UI slot like core UI apps. Test in v14 ready lifecycle.
- Risk: settings `onChange` callbacks reference `ui.delveDice` before/around ready. If settings change during startup, this may error.
- Risk: `hotReload` is development-only and may be unavailable depending on Foundry mode. It should remain non-blocking.
- Risk: `ready` mutates `game.settings.get("core", "combatTrackerConfig")` and assumes `turnMarker` shape with `src` and `animation`. Verify v14 core setting shape before relying on it.
- Note: `scripts/extractCompendia.mjs` was previously at risk because the manifest declared missing packs. That specific mismatch has been removed from `system.json`.

## Document Classes

Files:

- `module/documents/actor.mjs`
- `module/documents/item.mjs`
- `module/documents/combat.mjs`
- `module/documents/combatant.mjs`
- `module/documents/token.mjs`

Current state:

- `RipCryptActor` extends `Actor` without adding custom behavior yet.
- `RipCryptItem` extends `Item` and adds `quantifiedName`.
- `CONFIG.Actor.documentClass = RipCryptActor`.
- `CONFIG.Item.documentClass = RipCryptItem`.
- `CONFIG.Combat.documentClass = RipCryptCombat`.
- `CONFIG.Combatant.documentClass = RipCryptCombatant`.
- `CONFIG.Token.objectClass = RipCryptToken`.

v14 compatibility findings:

- Good: a minimal custom `Actor` document class can be registered in `init` without changing actor behavior, which keeps Actor and Item registration consistent for future migration work.
- Good: custom `Item` document behavior is small and low risk.
- Good: Actor and Item document classes are both registered through `CONFIG.*.documentClass` during `init`, which is the correct lifecycle phase for package configuration.
- High risk: combat/token overrides use protected or internal surfaces:
  - `Combat#_updateTurnMarkers`
  - `Token#_refreshTurnMarker`
  - `combatant.token?._object`
  - `token.renderFlags.set({ refreshTurnMarker: true })`
  - `CONFIG.Combat.settings.turnMarker.enabled`
  - `canvas.tokens.turnMarkers`
- High risk: `RipCryptCombatant._onCreate()` and `_onDelete()` override protected lifecycle methods without matching v14 signatures. v14 TypeDataModel and document lifecycle signatures include data/options/user arguments in many places. These should be checked against v14 API signatures before implementation.
- Verify: `_sortCombatants`, `nextTurn`, `previousTurn`, and `getTimeDelta` use core combat APIs that may have changed between v13 and v14.

Recommended migration approach:

1. Keep `RipCryptActor` minimal until a concrete Actor-level behavior requires document methods.
2. Keep `RipCryptItem` as-is initially.
3. Smoke-test actor and item creation without combat changes first.
4. Audit v14 `Combat`, `Combatant`, `Token`, and `TokenTurnMarker` APIs before touching grouped-turn behavior.
5. Prefer public hooks or document flags where possible. If protected overrides remain necessary, document why and keep them isolated.

## Data Models and `template.json`

Files:

- `module/data/Actor/Entity.mjs`
- `module/data/Actor/Hero.mjs`
- `module/data/Actor/Geist.mjs`
- `module/data/Item/Common.mjs`
- `module/data/Item/Ammo.mjs`
- `module/data/Item/Armour.mjs`
- `module/data/Item/Shield.mjs`
- `module/data/Item/Weapon.mjs`
- `module/data/Item/Good.mjs`
- `module/data/Item/Skill.mjs`
- `module/data/Item/Craft.mjs`
- `module/data/helpers.mjs`

Current state:

- There is no root `template.json`.
- Actors:
  - `hero` -> `HeroData`
  - `geist` -> `GeistData`
  - both extend `EntityData`
- Items:
  - `ammo` -> `AmmoData`
  - `armour` -> `ArmourData`
  - `craft` -> `CraftData`
  - `good` -> `GoodData`
  - `shield` -> `ShieldData`
  - `skill` -> `SkillData`
  - `weapon` -> `WeaponData`
- Models extend `foundry.abstract.TypeDataModel`.
- Models use `foundry.data.fields`.
- `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels` registration occurs in `init`.

v14 compatibility findings:

- Good: this already follows the v14 direction of replacing `template.json` with explicit `TypeDataModel` classes.
- Good: v14 docs explicitly support derived values and parent document access in `prepareBaseData()` and `prepareDerivedData()`.
- Good: `CONFIG.Actor.trackableAttributes.hero = HeroData.trackableAttributes` follows v14 data model guidance for token resources.
- Verify: `CONFIG.Actor.trackableAttributes` currently only defines `hero`, not `geist`. If geist actors need token resources, add or intentionally omit.
- Verify: item models with HTML fields now have matching manifest sanitization metadata. `GoodData`, `SkillData`, and `CraftData` use `fields.HTMLField({ ... })` for `description`, and `system.json` now declares:
  - `documentTypes.Item.good.htmlFields: ["description"]`
  - `documentTypes.Item.skill.htmlFields: ["description"]`
  - `documentTypes.Item.craft.htmlFields: ["description"]`
- Verify: `WeaponData.weight` and `ArmourData.weight` use `options: Object.values(gameTerms.WeightRatings)` on `fields.StringField`. Other schemas use `choices`. Confirm v14 `StringField` accepts `options` for choices; otherwise these fields may not validate as intended.
- Verify: `ArmourData.location` inner `StringField` uses `options: Object.values(gameTerms.Anatomy)`. This should likely be `choices`.
- Risk: `fields.SetField` values are populated from source arrays in compendium JSON, for example weapon `traits`. Verify v14 cleaning converts arrays to Sets for all Item creation/import paths.
- Risk: `CommonItemData.access` has `choices: gameTerms.Access`, where `gameTerms.Access` is an array. v14 fields often accept arrays or objects, but this needs validation.
- Risk: `EntityData.prepareBaseData()` assigns `this.aura` and `this.limit`, and `prepareDerivedData()` assigns `this.speed`. These are undeclared derived properties. v14 docs allow derived properties, but these values must be non-persistent and consistently available to sheets after preparation.
- Risk: `EntityData.prepareBaseData()` sets `this.guts.max = 0`, but `guts.max` is not a schema field because `guts` is created with `derivedMaximumBar`, which only declares `value`. This is an intentional derived max, but token resource editability and bar behavior must be tested.
- Risk: `ArmourData` and `WeaponData` implement `_preCreate` and `_preUpdate` on the TypeDataModel, not the `Item` document class. v14 `TypeDataModel` API includes lifecycle methods, so this may be valid, but the signatures and return semantics should be tested. `WeaponData._preUpdate` currently does not `await super._preUpdate(...)`.
- Risk: equip prompts in `_preCreate` call `DialogV2.confirm` with hard-coded strings.

Recommended data model sequence:

1. Validate all current schemas in v14 with actor/item creation and compendium import.
2. Confirm `options` vs `choices` behavior on `StringField`.
3. Create `docs/data-migration-map.md` before changing field names or source shapes.
4. Avoid adding a new `template.json`.

## Actor and Item Sheets

Files:

- `module/Apps/GenericApp.mjs`
- `module/Apps/ActorSheets/CombinedHeroSheet.mjs`
- `module/Apps/ActorSheets/StatsCardV1.mjs`
- `module/Apps/ActorSheets/SkillsCardV1.mjs`
- `module/Apps/ActorSheets/CraftCardV1.mjs`
- `module/Apps/ItemSheets/AllItemSheetV1.mjs`
- `module/Apps/ItemSheets/ArmourSheet.mjs`
- `module/Apps/RichEditor.mjs`

Current state:

- Actor sheets extend `GenericAppMixin(HandlebarsApplicationMixin(ActorSheetV2))`.
- Item sheets extend `GenericAppMixin(HandlebarsApplicationMixin(ItemSheetV2))`.
- `RichEditor` extends `HandlebarsApplicationMixin(DocumentSheetV2)`.
- Sheets use ApplicationV2 `DEFAULT_OPTIONS`, `PARTS`, action handlers, and form config.
- Sheets are registered with `Actors.registerSheet` and `Items.registerSheet`.

v14 compatibility findings:

- Good: sheets are already on v14-style `ActorSheetV2` and `ItemSheetV2`, not legacy `ActorSheet`/`ItemSheet`.
- Good: form options use `submitOnChange` and `closeOnSubmit: false`, matching modern ApplicationV2 form behavior in principle.
- Verify: `themes` option passed during sheet registration. Confirm this is still supported for v14 `DocumentSheetConfig.registerSheet`.
- Verify: `Items.unregisterSheet(game.system.id, AllItemSheetV1, { types: ["armour", "shield"] })` after registering a default item sheet. Confirm this removes only armour/shield associations as intended.
- Risk: `GenericAppMixin.render(options = {}, _options = {})` calls `super.render(options, _options)`. v14 `ApplicationV2.render` supports legacy two-argument compatibility, but this should be tested.
- Risk: `foundry.applications.instances.get(this.id)` is used to bring existing apps to front. v14 exposes ApplicationV2 instances in API docs, but direct global instance lookup should be verified.
- Risk: `_processSubmitData`, `_processFormData`, `_insertElement`, `_updatePosition`, `_tearDown`, and similar methods are protected ApplicationV2 internals. These overrides may break across v14 point releases.
- Risk: `RichEditor` sets `opts.sheetConfig = false` and then manually assigns `this.document`. Confirm v14 `DocumentSheetV2` constructor requirements.
- Risk: actor sheet coin inputs in `templates/Apps/SkillsCardV1/content.hbs` use `value="0"` and have no `name`, so actor `system.coin.*` cannot persist from the UI.
- Risk: `StatsCardV1.prepareFatePath` creates an empty option with `{ label, v: "" }` instead of `{ label, value: "" }`. This likely renders an empty value incorrectly.
- Risk: `ChatMessage.getSpeaker({ actor: this.actor })` in `DicePool` may use undefined `this.actor` because `DicePool` is not a document sheet. It should probably use `ChatMessage.getSpeaker()` or receive an actor explicitly.

Recommended sheet sequence:

1. Verify sheet registration and rendering in v14 before making layout changes.
2. Fix obvious persistence defects after baseline load, especially actor coin inputs and fate empty option.
3. Keep existing visual layout and templates.
4. Replace protected ApplicationV2 overrides only if they fail in v14.
5. Add focused manual tests for text fields, numbers, checkboxes, selects, rich text, embedded item controls, context menus, and roll buttons.

## Templates and Handlebars

Files:

- `templates/Apps/**/*.hbs`
- `templates/components/armour-summary.hbs`
- `templates/chat/roll.hbs`
- `module/handlebarHelpers/**/*.mjs`

Current state:

- Templates use custom helpers:
  - `rc-i18n`
  - `rc-options`
  - `rc-formFields`
  - `rc-empty-state`
- Templates also rely on Foundry/core helpers such as `checked`, `disabled`, `eq`, `not`, `ifThen`, and `concat`.
- Custom form helpers return raw HTML strings.
- Item field rendering is largely driven by `system.getFormFields()`.

v14 compatibility findings:

- Good: most form controls use `name` paths compatible with Foundry document updates, for example `system.level.glory`, `system.ability.grit`, and `system.cost.gold`.
- Verify: all assumed core helpers are available in v14 Handlebars. In particular, `ifThen`, `concat`, `eq`, and `not` should be checked during sheet render.
- Risk: raw helper-generated HTML needs careful escaping. `formFields` escapes scalar values, but option labels/values and some string interpolation paths should be reviewed.
- Risk: `string-tags` custom element must successfully submit a Set-compatible value for `fields.SetField`.
- Risk: `prose-mirror` usage in `RichEditor` must save HTMLField data correctly in v14.
- Risk: custom element slots and shadow DOM may interfere with form collection if a future form-associated custom element is added.
- Cleanup: hard-coded visible strings remain:
  - `Hero`
  - `Haste Check`
  - `Roll`
  - `Target`
  - `Focus`, `Fract`, `Flect`
  - `Name`
  - `Dice Pool`
  - `Text Editor`
  - combat tracker tooltip and aria strings
  - equip prompt strings
- Existing placeholder: `templates/chat/roll.hbs` contains only `HELLO` and is not wired into current roll output.

## Localization

File: `langs/en-ca.json`

Current state:

- Manifest declares one language:
  - `lang`: `en`
  - `name`: `English (Canadian)`
  - `path`: `langs/en-ca.json`
- `TYPES.Actor.hero`, `TYPES.Actor.geist`, and all item subtype names are present.
- Main namespace is `RipCrypt`.
- A custom localizer supports `@Key.Path` replacement inside localized strings.

v14 compatibility findings:

- Good: `TYPES` keys are present, which supports v14 create dialogs and type labels.
- Good: manifest language entry follows the required `lang`, `name`, `path` structure.
- Cleanup: `Name` is used as a localization key but is not defined in `langs/en-ca.json`. Foundry core may provide `Name`, but system templates should prefer a namespaced key or a known core key.
- Cleanup: several strings are still hard-coded in JS/templates, listed in the Templates section.
- Verify: `@TYPES.Item.${this.parent.type}` references in notifications are passed through the custom recursive localizer. Confirm this still resolves as expected in v14.
- Typo: `RipCrypt.notifs.info.cryptic-event-alert` says `Occured`; should be `Occurred` when doing localization cleanup.

## Dice and Chat

Files:

- `module/dice/CryptDie.mjs`
- `module/Apps/DicePool.mjs`
- `module/Apps/DelveDiceHUD.mjs`
- `templates/chat/roll.hbs`

Current state:

- `CryptDie` extends `foundry.dice.terms.Die`.
- `CONFIG.Dice.terms.d = CryptDie` replaces the default `d` die term.
- Custom modifier `rc` is added for Rip/Crypt logic.
- DicePool formula: `${diceCount}d8rc${target}`.
- Haste formula: `1d8xo=1`.
- Rolls use `new Roll(...)`, `await roll.evaluate()`, and `roll.toMessage(...)`.
- Current chat output uses Foundry default roll message rendering. `templates/chat/roll.hbs` is unused.

v14 compatibility findings:

- Good: v14 Roll API supports `evaluate()` and `toMessage()`.
- High risk: replacing `CONFIG.Dice.terms.d` changes all `d` dice in the system, not only RipCrypt d8 rolls. This is probably intentional, but it means every roll term using `d` uses `CryptDie`.
- Verify: v14 dice modifier syntax accepts custom modifier key `rc` in combination with explode and count-success logic.
- Verify: `this.explode("x=8", { recursive: true })`, `this.explode("xo=1", { recursive: false })`, and `this.countSuccess("cs>=...")` still behave as expected in v14.
- Risk: `CryptDie.total` clamps `super.total` to zero. Confirm this does not hide useful failure state for `crypted` rolls or interfere with v14 roll tooltips.
- Risk: `DicePool.#roll` creates a speaker with `this.actor`, but the app does not define `actor`.
- Cleanup: Haste chat flavor is hard-coded as `Haste Check`.
- Cleanup: If custom chat cards are desired, wire `templates/chat/roll.hbs` through `Roll.render({ template })` or `roll.toMessage` content generation. If default Foundry roll cards are acceptable, remove or document the placeholder.

## Packs and Compendia

Manifest declarations:

- `protection`, Item, path `packs/protection`
- `weapons`, Item, path `packs/weapons`

Current disk state:

- Exists:
  - `packs/protection/_source`
  - `packs/weapons/_source`
- Built pack database files are also present in both declared pack directories, for example `CURRENT`, `LOG`, and `MANIFEST-*`.
- Source JSON `_stats.coreVersion` is `13.350`.

v14 compatibility findings:

- Good: the manifest no longer declares non-existent `skills` and `geist` packs.
- Verify: existing built pack databases open cleanly in Foundry v14 after the manifest/package changes.
- Migration task: decide whether generated compendium DB files should be committed or built as part of packaging.
- Migration task: after data model changes, rebuild packs with a v14-compatible Foundry CLI workflow and test opening entries in v14.
- Risk: pack source includes folder documents and item documents mixed in `_source`. The build script uses `compilePack(..., { recursive: true })`; verify v14 CLI output matches Foundry v14 expectations.
- Risk: source data uses current item schemas. If schema fields are tightened, pack entries may fail validation or require `migrateData`.
- Cleanup: `.DS_Store` exists under `packs/`.

Recommended pack sequence:

1. Test existing `protection` and `weapons` packs in Foundry v14 before rebuilding them.
2. Rebuild `protection` and `weapons` after any schema changes.
3. Test pack sidebar visibility, opening folder entries, opening item entries, importing items, and dropping compendium items onto actors.
4. Update pack `_stats` only as part of intentional v14 pack rebuilds.

## Assets and CSS

Files:

- `assets/**/*.svg`
- `assets/turn-marker.png`
- `assets/_credit.txt`
- `assets/README.md`
- `templates/css/main.css`
- `templates/css/**/*.css`
- `templates/Apps/**/*.css`

Current state:

- Assets are mostly SVG icons and silhouettes.
- `assets/turn-marker.png` is used in `ready` to set the core combat turn marker.
- Custom elements fetch SVG and CSS files dynamically from `systems/ripcrypt/...`.
- CSS is imported through `templates/css/main.css`, which imports app and component CSS.

v14 compatibility findings:

- Good: assets are local and referenced relative to the system path.
- Good: asset licensing notes exist in `assets/README.md` and `assets/_credit.txt`.
- Verify: `fetch("./systems/${game.system.id}/assets/...")` and `fetch("./systems/${game.system.id}/templates/...")` work under v14 hosted paths.
- Risk: SVG parsing uses `innerHTML` with local asset content. Since assets are bundled, this is probably acceptable, but only trusted local SVG should be used.
- Structural decision: `templates/css/main.css` remains in place. Moving it to a new `styles/` directory would require broad path churn without a confirmed v14 benefit.
- Risk: app windows use `width: "auto"`, `height: "auto"`, and `resizable: false`; v14 rendering may need CSS/window sizing adjustments for overflow.
- Risk: `templates/Apps/CombinedHeroSheet/style.css` references `.HeroSkillsCardV1`, while the current class appears to be `SkillsCardV1`; verify whether this selector is stale.

## Settings, Sockets, and Hooks

Files:

- `module/settings/*.mjs`
- `module/sockets/*.mjs`
- `module/hooks/*.mjs`

Current state:

- Settings are registered during `init`.
- Some settings use primitive constructors and some use `foundry.data.fields.*`.
- Socket namespace `system.ripcrypt` is enabled by manifest `socket: true`.
- Socket handlers support `notify` and `updateSands`.

v14 compatibility findings:

- Good: v14 system manifest supports `socket: true` for `system.${id}`.
- Good: settings are registered early.
- Verify: settings using `type: new StringField(...)` and `type: new NumberField(...)` are accepted by v14 settings UI and persist as expected.
- Risk: `registerDevSettings` reads `game.settings.get("ripcrypt", "devMode")` while registering another setting. It should work because `devMode` is registered immediately above it, but test first launch.
- Risk: socket handler assumes all payloads can be trusted enough to dispatch by string event key. It validates event existence but not full payload shape beyond handler checks.
- Risk: `notify` allows only `info`, `error`, and `success`, not `warn`, while code elsewhere uses warnings directly.
- Cleanup: dev setting name `Default Tab` is hard-coded and not localized.

## Likely Breaking Changes and Risk Register

### Blocking Before v14 Load

- Verify that Foundry v14 accepts the current `styles` object form in `system.json`.
- Confirm the declared built pack databases open cleanly in v14.

### High Risk Runtime Areas

- Grouped combat and token turn marker overrides.
- `CONFIG.CACHE.componentListeners` custom-element integration.
- Broad `CONFIG.Dice.terms.d` replacement.
- Protected ApplicationV2 overrides.
- DataModel lifecycle hooks on item system data.

### Medium Risk Runtime Areas

- `StringField` option validation.
- SetField cleaning from form controls and compendium arrays.
- RichEditor and ProseMirror persistence.
- `ui.delveDice` creation and settings callbacks.
- Sheet registration with multiple actor sheets per actor type.
- Compendium import validation after schema tightening.

### Low Risk or Cleanup Areas

- Hard-coded labels and window titles.
- Placeholder chat template.
- `.DS_Store` under packs.
- Stale CSS selectors.
- Typo in localization.

## Suggested Migration Order

1. Package load pass:
   - Verify package recognition with the current manifest changes.
   - Confirm `styles` object loading.
   - Confirm declared packs open cleanly.
2. Data validation pass:
   - Validate all actor and item model schemas in v14.
   - Confirm `choices`/`options`, SetField cleaning, and derived actor properties.
   - Create `docs/data-migration-map.md`.
3. Sheet smoke pass:
   - Open hero/geist sheets.
   - Open each item sheet.
   - Test field persistence, especially actor coin, fate, abilities, guts, armour locations, weapon traits, ranges, rich text, and equipped state.
4. Gameplay pass:
   - Test DicePool rolls, Haste rolls, chat output, and custom die tooltips.
   - Test item create/edit/delete and compendium drops.
5. Combat pass:
   - Test grouped initiatives, next/previous turn, tracker rendering, and token turn markers.
   - Replace protected/internal APIs only where v14 actually breaks.
6. Localization and polish:
   - Localize remaining visible strings.
   - Fix stale selectors, overflow, and layout issues found during runtime QA.
   - Update `docs/testing.md` with v14 smoke test results.

## Manual v14 Test Checklist

- System appears in Foundry v14 setup.
- A RipCrypt world can be created and launched.
- Console has no fatal errors on world load.
- `ui.delveDice` renders for GM and non-GM users.
- Create `hero` actor.
- Create `geist` actor.
- Open Combined Hero Sheet, Stats Card, Skills Card, and Craft Card.
- Edit actor name, fate, glory, step, rank, abilities, guts, and coin.
- Close and reopen actor sheet; confirm values persist.
- Create each item type: ammo, armour, craft, good, shield, skill, weapon.
- Open each item sheet.
- Edit item fields, close, reopen, and confirm persistence.
- Add owned items to actors.
- Equip weapons, armour, and shields; confirm prompts and constraints.
- Use actor context menus to edit/delete embedded items.
- Test favourite ammo popover and foreign quantity updates.
- Run DicePool ability rolls.
- Run Haste check.
- Confirm chat messages render and roll tooltips are readable.
- Build and open compendium packs.
- Import pack items.
- Drag/drop pack items onto actors if supported.
- Create combat with hero and geist tokens.
- Test grouped turn order, next/previous turn, and turn markers.
- Check browser console after every workflow.
