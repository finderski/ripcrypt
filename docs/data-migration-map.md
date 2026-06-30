# RipCrypt Data Migration Map

Date: 2026-06-28

Scope: imported Foundry VTT v13 RipCrypt system currently in this repository. This document maps the current persisted data shape and sheet update paths to Foundry VTT v14 `TypeDataModel` fields. It is documentation only and does not change implementation files.

References reviewed:

- `AGENTS.md`
- `docs/project-brief.md`
- `docs/foundry-v14-authoring-standards.md`
- `docs/ripcrypt-foundry-v14-plan.md`
- `docs/v13-to-v14-audit.md`
- `docs/current-feature-inventory.md`
- `system.json`
- `module/data/**/*.mjs`
- `module/Apps/**/*.mjs`
- `module/handlebarHelpers/**/*.mjs`
- `templates/Apps/**/*.hbs`
- `packs/protection/_source/*.json`
- `packs/weapons/_source/*.json`

Rules PDF usage:

- `RipCrypt-Digital-Core-Rulebook-v1.0.pdf` was not needed for this pass. The current mapping is based on implemented data fields and update paths, not unresolved rules interpretation.

## Summary

The imported v13 system already uses `foundry.abstract.TypeDataModel` for Actor and Item `system` data. There is no root `template.json` in the repository. The v14 migration should therefore preserve the current TypeDataModel class structure, validate it against v14, and only adjust schema definitions where v14 requires it.

Current model registration:

- `CONFIG.Actor.dataModels.hero = HeroData`
- `CONFIG.Actor.dataModels.geist = GeistData`
- `CONFIG.Item.dataModels.ammo = AmmoData`
- `CONFIG.Item.dataModels.armour = ArmourData`
- `CONFIG.Item.dataModels.craft = CraftData`
- `CONFIG.Item.dataModels.good = GoodData`
- `CONFIG.Item.dataModels.shield = ShieldData`
- `CONFIG.Item.dataModels.skill = SkillData`
- `CONFIG.Item.dataModels.weapon = WeaponData`

Primary migration rule:

- Preserve existing `system.*` field names wherever possible.
- Keep user-editable values in explicit schema fields.
- Keep calculated values non-persistent in `prepareBaseData()`, `prepareDerivedData()`, or getters.
- Do not introduce `template.json`.

## Status Legend

- `user-editable`: persisted field directly editable through sheets, item dialogs, or update paths.
- `persisted`: persisted field exists in schema or pack data, but direct sheet editing may be missing or indirect.
- `derived`: calculated from persisted data or embedded documents; do not persist in v14 unless a strong reason appears.
- `obsolete`: stale, unused, placeholder, or should be removed/ignored during migration.
- `ambiguous`: meaning, source, validation, or UI behavior needs clarification before changing.

## `template.json`

| Current source | Status | v14 mapping | Notes |
| --- | --- | --- | --- |
| No `template.json` present | `obsolete` | Do not create one. Continue using `TypeDataModel` classes. | The current source of truth is `module/data/Actor/*.mjs` and `module/data/Item/*.mjs`. |

## Actor Types

Actor types are declared in `system.json`:

- `hero`
- `geist`

Both actor types currently use the same schema by extending `EntityData`.

| Actor type | Current model | v14 model mapping | Notes |
| --- | --- | --- | --- |
| `hero` | `HeroData extends EntityData` | Keep `HeroData extends EntityData`. Register through `CONFIG.Actor.dataModels.hero`. | Primary actor sheet workflows target this type. |
| `geist` | `GeistData extends EntityData` | Keep `GeistData extends EntityData`. Register through `CONFIG.Actor.dataModels.geist`. | Same data shape as hero. Confirm whether all hero fields make rules sense for geists before adding automation. |

## Actor System Data Map

Files:

- `module/data/Actor/Entity.mjs`
- `module/data/Actor/Hero.mjs`
- `module/data/Actor/Geist.mjs`
- `templates/Apps/StatsCardV1/content.hbs`
- `templates/Apps/SkillsCardV1/content.hbs`

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| `system.ability` | persisted | `fields.SchemaField` | Keep `SchemaField`. | Child fields update from Stats card. | Container for core ability values. |
| `system.ability.grit` | user-editable | `fields.NumberField`, integer, min `0`, initial `1` | Keep `NumberField({ min: 0, initial: 1, integer: true, required: true, nullable: false })`. | `name="system.ability.grit"` via ability loop. | Used for rolls and guts max. |
| `system.ability.gait` | user-editable | Same as grit | Keep same field definition. | `name="system.ability.gait"` via ability loop. | Used for speed. |
| `system.ability.grip` | user-editable | Same as grit | Keep same field definition. | `name="system.ability.grip"` via ability loop. | Used for rolls and guts max. |
| `system.ability.glim` | user-editable | Same as grit | Keep same field definition. | `name="system.ability.glim"` via ability loop. | Used for rolls and guts max. |
| `system.ability.thin-glim` | ambiguous | Not an actor field; appears only in `gameTerms.Abilities`. | Do not add as actor data unless rules/UI require it. | None. | Current skill grouping maps `thin-glim` skills into `glim`; this is not an actor ability value. |
| `system.guts` | persisted/derived | `derivedMaximumBar(0, 5)` returns `SchemaField({ value })`; runtime adds `max`. | Keep `SchemaField` with persisted `value`; derive `max`. | `system.guts.value` only. | Current token bar uses `guts`; v14 token resource behavior must be tested because `max` is derived, not schema-declared. |
| `system.guts.value` | user-editable | `fields.NumberField`, integer, min `0`, initial `5` | Keep `NumberField({ min: 0, initial: 5, integer: true, nullable: false })`. | `name="system.guts.value"` in Stats card. | Current health/current guts value. |
| `system.guts.max` | derived | Assigned in `prepareBaseData()` and `prepareDerivedData()` | Keep derived, do not persist. | None. | Reset to `0`, then calculated as sum of ability values. |
| `system.coin` | persisted | `fields.SchemaField` | Keep `SchemaField`. | Current visible Skills card inputs do not submit values. | Intended user-editable currency fields, but current UI is broken. |
| `system.coin.gold` | persisted/ambiguous | `fields.NumberField`, integer, initial `5`, nullable false | Keep persisted `NumberField`. | Missing. Skills card input has `value="0"` and no `name`. | Treat as user-editable intended field; fix sheet path during sheet migration. |
| `system.coin.silver` | persisted/ambiguous | `fields.NumberField`, integer, initial `0`, nullable false | Keep persisted `NumberField`. | Missing. Skills card input has `value="0"` and no `name`. | Same as gold. |
| `system.coin.copper` | persisted/ambiguous | `fields.NumberField`, integer, initial `0`, nullable false | Keep persisted `NumberField`. | Missing. Skills card input has `value="0"` and no `name`. | Same as gold. |
| `system.fate` | user-editable | `fields.StringField`, initial `""`, blank true, choices North/East/South/West/empty | Keep `StringField` with same choices. | `name="system.fate"` in Stats card. | Used by combat initiative grouping. Empty option builder currently uses `v` instead of `value`, which should be corrected in sheet migration. |
| `system.level` | persisted | `fields.SchemaField` | Keep `SchemaField`. | Child fields update from Stats card. | Container for advancement state. |
| `system.level.glory` | user-editable | `fields.NumberField`, integer, min `0`, initial `0` | Keep `NumberField`. | `name="system.level.glory"` in Stats card. | |
| `system.level.step` | user-editable | `fields.NumberField`, integer, min `1`, max `3`, initial `1` | Keep `NumberField`. | `name="system.level.step"` in Stats card. | |
| `system.level.rank` | user-editable | `fields.StringField`, choices novice/adept/expert/master, initial novice | Keep `StringField` with rank choices. | `name="system.level.rank"` in Stats card. | Drives aura and skill/craft advance display. |
| `system.aura` | derived | Assigned in `prepareBaseData()` | Keep derived object, do not persist. | None. | `{ normal, heavy }` from rank. Displayed on Skills and Craft cards. |
| `system.aura.normal` | derived | `(rank + 1) * 2` | Keep derived. | None. | |
| `system.aura.heavy` | derived | `(rank + 2) * 2` | Keep derived. | None. | |
| `system.limit` | derived | Assigned in `prepareBaseData()` | Keep derived constant object, do not persist. | None. | Current values: weapons `4`, equipment `12`, skills `4`. |
| `system.limit.weapons` | derived | Constant `4` | Keep derived. | None. | Used by equipped weapon display and equip guard. |
| `system.limit.equipment` | derived | Constant `12` | Keep derived. | None. | Used by gear slot display. |
| `system.limit.skills` | derived | Constant `4` | Keep derived. | None. | Used by skill list display. |
| `system.speed` | derived | Assigned in `prepareDerivedData()` | Keep derived, do not persist. | None. | Display-only. |
| `system.speed.move` | derived | `ability.gait + 3` | Keep derived. | None. | |
| `system.speed.run` | derived | `(ability.gait + 3) * 2` | Keep derived. | None. | |
| `system.equippedWeapons` | derived | Getter over `parent.itemTypes.weapon` | Keep getter-derived. | Controlled by embedded weapon `system.equipped`. | Do not persist on actor. |
| `system.equippedArmour` | derived | Getter over `parent.itemTypes.armour` | Keep getter-derived. | Controlled by embedded armour `system.equipped` and `system.location`. | Do not persist on actor. |
| `system.equippedShield` | derived | Getter over `parent.itemTypes.shield` | Keep getter-derived. | Controlled by embedded shield `system.equipped`. | Do not persist on actor. |
| `system.defense` | derived | Getter combining armour and shield protection by anatomy slot | Keep getter-derived. | None. | Do not persist on actor. |

Actor token resource mapping:

| Current path | Status | v14 mapping | Notes |
| --- | --- | --- | --- |
| `CONFIG.Actor.trackableAttributes.hero.bar = ["guts"]` | migrate | Keep or mirror for v14. | Confirm derived `guts.max` works for token bars. |
| `CONFIG.Actor.trackableAttributes.hero.value` entries | migrate | Keep for hero. | Includes abilities, level fields, and coin. |
| `CONFIG.Actor.trackableAttributes.geist` | ambiguous | Add only if geists should expose the same token resources. | No current registration exists. |

## Item Common Data Map

`CommonItemData` is used by `ammo`, `armour`, `good`, `shield`, and `weapon`.

Files:

- `module/data/Item/Common.mjs`
- `module/data/helpers.mjs`
- `module/handlebarHelpers/inputs/currency.mjs`

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| `system.quantity` | user-editable | `requiredInteger({ min: 0, initial: 1 })` | Keep `NumberField({ min: 0, initial: 1, integer: true, required: true, nullable: false })`. | Generic item fields, armour item header, foreign ammo updates. | Used by `quantifiedName` and ammo totals. |
| `system.access` | user-editable | `fields.StringField`, blank true, choices `gameTerms.Access` | Keep `StringField`; verify v14 accepts array choices. | Generic item dropdown or ArmourSheet dropdown. | Current values are `Common`, `Uncommon`, `Rare`, `Scarce`, or empty string. |
| `system.cost` | persisted | `fields.SchemaField` | Keep `SchemaField`. | Child fields update through cost helper or ArmourSheet. | |
| `system.cost.gold` | user-editable | `optionalInteger()` nullable integer, initial null | Keep nullable `NumberField`. | `system.cost.gold`. | Pack source commonly stores null. |
| `system.cost.silver` | user-editable | `optionalInteger()` nullable integer, initial null | Keep nullable `NumberField`. | `system.cost.silver`. | Existing pack source commonly stores a number. |
| `system.cost.copper` | user-editable | `optionalInteger()` nullable integer, initial null | Keep nullable `NumberField`. | `system.cost.copper`. | Pack source commonly stores null. |

## Weapon Item Data Map

File: `module/data/Item/Weapon.mjs`

Existing pack source fields:

- `quantity`
- `cost.gold`
- `cost.silver`
- `cost.copper`
- `traits`
- `range.short`
- `range.long`
- `damage`
- `wear.value`
- `wear.max`
- `equipped`
- `weight`
- `access`

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| Common fields | user-editable | Inherits `CommonItemData` | Keep common schema. | Generic item sheet. | |
| `system.traits` | user-editable/ambiguous | `fields.SetField(fields.StringField)` | Keep `SetField` if v14 cleaning handles arrays and `<string-tags>` output. | `name="system.traits"` through `<string-tags>`. | Pack source stores arrays. Sheet helper submits through custom element; test v14 form cleaning. |
| `system.range` | persisted | `fields.SchemaField` | Keep `SchemaField`. | Child paths update from generic item sheet. | |
| `system.range.short` | user-editable | nullable integer | Keep nullable `NumberField`. | `system.range.short`. | Can be null for melee weapons. |
| `system.range.long` | user-editable | nullable integer | Keep nullable `NumberField`. | `system.range.long`. | Can be null. |
| `system.attackAttribute` | user-editable | `fields.StringField`, choices grit/gait/grip/glim, initial grip | Keep persisted `StringField`. | `system.attackAttribute`. | Drives weapon attack DicePool dice count from the owning actor's matching ability. |
| `system.damage` | user-editable | required integer, min `0`, initial `0` | Keep `NumberField`. | `system.damage`. | |
| `system.wear` | persisted | `barAttribute(0, 0, 4)` | Keep `SchemaField({ value, max })`. | Child paths update from generic item sheet. | |
| `system.wear.value` | user-editable | integer, min `0`, initial `0`, max `4` | Keep `NumberField`. | `system.wear.value`. | Current wear. |
| `system.wear.max` | user-editable | integer, min `0`, initial `0`, max `4` | Keep `NumberField`. | `system.wear.max`. | Maximum wear. |
| `system.equipped` | user-editable | boolean, initial false | Keep `BooleanField`. | Only shown on embedded items. | Equip constraints may alter submitted changes in `_preUpdate`. |
| `system.weight` | user-editable/ambiguous | `fields.StringField`, nullable true, initial null, `options` weight values | Keep path; use v14-valid `choices` if `options` is invalid. | `system.weight`. | Existing pack values: `light`, `modest`, `heavy`, or null. |
| `system.traitString` | derived | Getter joining `traits` | Keep getter, do not persist. | None. | Used by actor weapon table. |
| `system.rangeString` | derived | Getter joining short/long range | Keep getter, do not persist. | None. | Used by actor weapon table. |
| `system.forceRerender` | obsolete | Runtime ad hoc flag | Do not schema-map; keep internal only if needed. | Set during invalid equip update. | Should not persist. |

## Ammo Item Data Map

File: `module/data/Item/Ammo.mjs`

Existing pack source fields:

- `quantity`
- `cost.gold`
- `cost.silver`
- `cost.copper`
- `access`

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| Common fields | user-editable | Inherits `CommonItemData` | Keep common schema. | Generic item sheet. | Ammo has no additional system schema fields. |
| `flags.ripcrypt.favourited` | user-editable | Item flag, not `system` data | Keep as flag unless a data-model reason emerges. | `AmmoTracker` star/unstar actions. | Drives favourite ammo slots. |

Foreign ammo update paths:

| Current field | Status | v14 mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- |
| `system.quantity` | user-editable | Keep common quantity field. | `data-foreign-name="system.quantity"` from Skills card favourite ammo and AmmoTracker popover. | Uses `fromUuid(...).update({ "system.quantity": value })`. |

## Armour Item Data Map

File: `module/data/Item/Armour.mjs`

Existing pack source fields:

- `quantity`
- `cost.gold`
- `cost.silver`
- `cost.copper`
- `protection`
- `location`
- `equipped`
- `weight`
- `access`

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| Common fields | user-editable | Inherits `CommonItemData` | Keep common schema. | ArmourSheet and item header. | |
| `system.protection` | user-editable | required integer, min `0`, initial `1` | Keep `NumberField`. | `name="system.protection"` in ArmourSheet. | Used by actor defense calculation. |
| `system.location` | user-editable/ambiguous | `fields.SetField(fields.StringField)` | Keep `SetField`; use v14-valid inner string choices. | Multiple checkboxes with `name="system.location"`, filtered in `_processFormData()`. | Pack source stores arrays. Current inner field uses `options`; likely should be `choices` for v14. |
| `system.equipped` | user-editable | boolean, initial false | Keep `BooleanField`. | Only shown on embedded items. | Equip constraints prevent overlapping slots. |
| `system.weight` | user-editable/ambiguous | nullable `fields.StringField`, `options` weight values | Keep path; use v14-valid `choices` if needed. | `name="system.weight"` in ArmourSheet. | Existing pack values include string and null. |
| `system.locationString` | derived | Getter joining `location` | Keep getter, do not persist. | None. | |
| `system.forceRerender` | obsolete | Runtime ad hoc flag | Do not schema-map; keep internal only if needed. | Set during invalid equip update. | Should not persist. |

## Shield Item Data Map

File: `module/data/Item/Shield.mjs`

`ShieldData` currently extends `ArmourData` and changes only equip validation.

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| All armour fields | user-editable | Inherits `ArmourData` | Keep shield as `ShieldData extends ArmourData`. | ArmourSheet. | Existing pack source contains shield location arrays and protection values. |
| Single-shield equip constraint | derived/behavior | `_canEquip()` checks actor's equipped shield | Keep behavior, but validate lifecycle hook in v14. | Triggered when `system.equipped` updates. | Not a persisted field. |

## Good Item Data Map

File: `module/data/Item/Good.mjs`

No current pack source for `good` exists in this repository, but the type is declared and model-backed.

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| Common fields | user-editable | Inherits `CommonItemData` | Keep common schema. | Generic item sheet. | |
| `system.description` | user-editable | `fields.HTMLField`, blank true, nullable false | Keep `HTMLField`. | RichEditor via `data-path="system.description"` and `<prose-mirror name="system.description">`. | Add `documentTypes.Item.good.htmlFields = ["description"]` in `system.json` for v14 sanitization. |

## Skill Item Data Map

File: `module/data/Item/Skill.mjs`

No current pack source for `skill` exists in this repository, but the type is declared and model-backed.

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| `system.ability` | user-editable | `fields.StringField`, choices abilities, initial `grit` | Keep `StringField`. | Generic item sheet dropdown. | Choices include `thin-glim`; actor sheet groups `thin-glim` skills with `glim`. |
| `system.description` | user-editable | `fields.HTMLField` | Keep `HTMLField`. | RichEditor. | Add `documentTypes.Item.skill.htmlFields = ["description"]` in `system.json`. |
| `system.advances` | persisted | `fields.SchemaField` built from ranks | Keep `SchemaField`. | Generic item sheet group. | Stores per-rank use/detail text. |
| `system.advances.novice` | user-editable | nullable `fields.StringField`, initial null | Keep `StringField({ nullable: true, initial: null })`. | `system.advances.novice`. | |
| `system.advances.adept` | user-editable | nullable string | Keep same. | `system.advances.adept`. | |
| `system.advances.expert` | user-editable | nullable string | Keep same. | `system.advances.expert`. | |
| `system.advances.master` | user-editable | nullable string | Keep same. | `system.advances.master`. | |

## Craft Item Data Map

File: `module/data/Item/Craft.mjs`

No current pack source for `craft` exists in this repository, but the type is declared and model-backed.

`CraftData` extends `SkillData`, deletes `ability`, and adds `aspect`.

| Current field | Status | Current source/type | v14 TypeDataModel mapping | Sheet update path | Notes |
| --- | --- | --- | --- | --- | --- |
| `system.aspect` | user-editable | `fields.StringField`, choices `focus`, `flect`, `fract`, initial `flect` | Keep `StringField`. | Generic item sheet dropdown. | Used by Craft card grouping. |
| `system.description` | user-editable | inherited `fields.HTMLField` | Keep `HTMLField`. | RichEditor. | Add `documentTypes.Item.craft.htmlFields = ["description"]` in `system.json`. |
| `system.advances.*` | user-editable | inherited rank string fields | Keep same as skill. | Generic item sheet group. | |
| `system.ability` on craft | obsolete/ambiguous | Removed from schema by `delete schema.ability` | Do not schema-map for craft. | None. | If old craft documents contain this field, v14 migration should drop or ignore it. No current pack source exists to confirm. |

## Sheet Update Path Map

### Actor Sheets

| Sheet/app | Submitted fields | Status | Notes |
| --- | --- | --- | --- |
| `StatsCardV1` | `name` | user-editable | Actor name. |
| `StatsCardV1` | `system.fate` | user-editable | Fate dropdown. Empty option currently has a builder bug. |
| `StatsCardV1` | `system.level.glory` | user-editable | Number input. |
| `StatsCardV1` | `system.level.step` | user-editable | Number input. |
| `StatsCardV1` | `system.level.rank` | user-editable | Rank dropdown. |
| `StatsCardV1` | `system.ability.grit`, `system.ability.gait`, `system.ability.grip`, `system.ability.glim` | user-editable | Generated from current `system.ability` keys. |
| `StatsCardV1` | `system.guts.value` | user-editable | Current guts. |
| `SkillsCardV1` | No actor `system.*` form names for coin | ambiguous | Coin fields are visible but do not submit. Intended paths should be `system.coin.gold`, `system.coin.silver`, `system.coin.copper`. |
| `CombinedHeroSheet` | Same fields as embedded Stats/Skills/Craft parts | migrate | Composite sheet delegates context and render handling to child card logic. |
| `CraftCardV1` | No actor `system.*` submit fields | derived display | Displays aura and embedded craft items. |

### Item Sheets

| Sheet/app | Submitted fields | Status | Notes |
| --- | --- | --- | --- |
| `AllItemSheetV1` | `name` | user-editable | Generic item name. |
| `AllItemSheetV1` | Dynamic `system.*` from `document.system.getFormFields(ctx)` | user-editable | Used by ammo, weapon, good, skill, and craft. |
| `ArmourSheet` header | `name`, `system.quantity` | user-editable | Shared item header partial. |
| `ArmourSheet` content | `system.access`, `system.weight`, `system.equipped`, `system.cost.gold`, `system.cost.silver`, `system.cost.copper`, `system.location`, `system.protection` | user-editable | `system.equipped` only appears for embedded items. |
| `ArmourSheet._processFormData()` | `system.location` | migrate | Filters unchecked/null location values before update. |
| `RichEditor` | `system.description` or another provided path | user-editable | Used for rich text fields; constructed only if the target document has the path. |
| Foreign update helper | `system.quantity` | user-editable | Used by favourite ammo and ammo tracker quantity inputs through document UUID. |

### Dynamic Item `getFormFields()` Paths

| Item type | Dynamic paths | Notes |
| --- | --- | --- |
| `ammo` | `system.quantity`, `system.access`, `system.cost.gold`, `system.cost.silver`, `system.cost.copper` | Uses generic item sheet. |
| `weapon` | `system.quantity`, `system.access`, `system.cost.*`, `system.weight`, `system.traits`, `system.range.short`, `system.range.long`, `system.damage`, `system.wear.value`, `system.wear.max`, optional `system.equipped` | `system.equipped` only for embedded items. |
| `good` | `system.quantity`, `system.access`, `system.cost.*`, `system.description` | Description is edited by RichEditor, not inline. |
| `skill` | `system.ability`, `system.description`, `system.advances.novice`, `system.advances.adept`, `system.advances.expert`, `system.advances.master` | No common quantity/cost/access fields. |
| `craft` | `system.aspect`, `system.description`, `system.advances.novice`, `system.advances.adept`, `system.advances.expert`, `system.advances.master` | No common quantity/cost/access fields. |

## Compendium Source Data Alignment

Existing source packs:

- `packs/weapons/_source`
- `packs/protection/_source`

Observed system field sets:

| Pack/type | Observed fields | Alignment |
| --- | --- | --- |
| `weapons` / `weapon` | `quantity`, `cost`, `traits`, `range`, `damage`, `wear`, `equipped`, `weight`, `access` | Matches `WeaponData`. |
| `weapons` / `ammo` | `quantity`, `cost`, `access` | Matches `AmmoData`. |
| `protection` / `armour` | `quantity`, `cost`, `protection`, `location`, `equipped`, `weight`, `access` | Matches `ArmourData`. |
| `protection` / `shield` | `quantity`, `cost`, `protection`, `location`, `equipped`, `weight`, `access` | Matches `ShieldData` inherited schema. |
| `skills` pack | Missing | Manifest declares it, but no source exists. |
| `geist` pack | Missing | Manifest declares it, but no source exists. |

Pack migration notes:

- Existing pack `traits` and `location` values are arrays; v14 must clean them into `SetField` values.
- Existing pack optional numeric fields use `null` for absent costs/ranges/weights.
- Existing pack `_stats.coreVersion` is `13.350`; update only as part of an intentional v14 pack rebuild.
- No actor pack source exists, so actor migration must be validated through created world actors or test fixtures rather than existing pack actors.

## Obsolete or Non-System Data

| Field/path | Status | v14 handling | Notes |
| --- | --- | --- | --- |
| `template.json` fields | obsolete | None. | No file exists. |
| `system.forceRerender` | obsolete | Do not persist or schema-map. | Runtime flag set on item system data after invalid equip submissions. |
| `weapon.system.traitString` | derived | Keep getter only. | Do not persist. |
| `weapon.system.rangeString` | derived | Keep getter only. | Do not persist. |
| `armour.system.locationString` | derived | Keep getter only. | Do not persist. |
| Actor `system.equippedWeapons`, `system.equippedArmour`, `system.equippedShield`, `system.defense` | derived | Keep getters only. | Derived from embedded items. |
| Actor `system.aura`, `system.limit`, `system.speed`, `system.guts.max` | derived | Keep calculated data only. | Not present in source schema. |
| Item flags under `flags.ripcrypt.favourited` | persisted non-system | Keep as flag. | Not part of TypeDataModel. |
| Document-level fields such as `name`, `type`, `img`, `effects`, `folder`, `ownership`, `_stats` | persisted document data | Let Foundry document schemas handle these. | Not system TypeDataModel fields. |

## Ambiguous Fields and Decisions Needed

| Field/path | Ambiguity | Recommended next step |
| --- | --- | --- |
| `system.coin.*` | Actor schema defines coin fields and token resources, but current sheet does not submit them. | Preserve schema; fix sheet update paths during actor sheet migration. |
| `system.guts.max` | Derived maximum is not declared in schema but token bars may expect value/max shape. | Test token resource bar behavior in v14. If required, keep max derived but ensure it is visible to token resource resolution. |
| `system.weight` on weapon/armour/shield | Current schema uses `options` instead of `choices`. | Validate in v14; likely convert to `choices` while preserving field values. |
| `system.location` on armour/shield | Current inner `StringField` uses `options`; source data is array, runtime is Set. | Validate v14 cleaning; likely use `choices`. |
| `system.traits` on weapon | Source data is array, sheet control is `<string-tags>`, model field is Set. | Test creation, editing, pack import, and form submission in v14. |
| `system.description` on good/skill/craft | Uses `HTMLField`, but manifest has no `htmlFields` metadata. | Add `htmlFields` entries in `system.json` before v14 runtime testing. |
| `system.ability` on craft | Removed from craft schema but may exist in old imported worlds if craft evolved from skill. | When world migration exists, drop/ignore stale craft `system.ability`. |
| `system.fate` empty option | Data model supports empty string, but current option object uses `v` instead of `value`. | Fix sheet option builder while preserving empty-string field semantics. |
| `thin-glim` | Present as a skill ability choice, not actor ability data. | Keep as skill ability choice unless rules review says otherwise. |
| `geist` actor data parity | Geists currently share hero schema. | Preserve for load compatibility; rules review can later decide whether UI should hide irrelevant fields. |

## Initial v14 Model Implementation Checklist

Use this checklist when making the first implementation pass:

1. Keep `HeroData`, `GeistData`, and `EntityData` names and field paths.
2. Keep item data class names and type registration paths.
3. Add v14 manifest `htmlFields` metadata for `good`, `skill`, and `craft` descriptions.
4. Validate `StringField` choice syntax and update `options` to `choices` only where needed.
5. Validate SetField cleaning for pack arrays and custom sheet controls.
6. Keep actor derived data out of persisted schema.
7. Fix actor coin sheet paths without changing `system.coin.*`.
8. Preserve embedded item fields because actor display and equip constraints depend on them.
9. Treat missing `skills` and `geist` packs as manifest/content issues, not TypeDataModel fields.
10. Run v14 creation/edit/save/reopen tests for every actor and item type after schema changes.
