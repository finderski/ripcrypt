# RipCrypt Current Feature Inventory

Date: 2026-06-28

Scope: imported Foundry VTT v13 RipCrypt system currently in this repository. This document inventories what the codebase already implements. It does not propose code changes beyond a keep/migrate/replace/remove classification to guide the v14 migration.

References reviewed:

- `AGENTS.md`
- `docs/project-brief.md`
- `docs/foundry-v14-authoring-standards.md`
- `docs/ripcrypt-foundry-v14-plan.md`
- `docs/v13-to-v14-audit.md`
- imported system code under `module/`, `templates/`, `langs/`, `packs/`, and `assets/`

Rules PDF usage:

- `RipCrypt-Digital-Core-Rulebook-v1.0.pdf` was not needed for this inventory pass. The current document is based on implemented code only.

## Status Legend

- `keep`: preserve as-is conceptually; avoid renaming or redesigning it.
- `migrate`: existing feature should carry forward to v14, but implementation or API touch-up is expected.
- `replace`: current implementation is partial, placeholder, or fragile enough that a new implementation is likely better than preserving the exact code path.
- `remove`: current entry is stale, inactive, or should be dropped unless a concrete use case reappears.

## Actor Types

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `hero` actor type | `keep` | Primary player-facing actor type. Uses shared `EntityData`. | `system.json`, `module/data/Actor/Hero.mjs`, `module/data/Actor/Entity.mjs` |
| `geist` actor type | `keep` | Secondary actor type with the same base data model shape as `hero`. | `system.json`, `module/data/Actor/Geist.mjs`, `module/data/Actor/Entity.mjs` |
| Shared actor system data | `migrate` | Implements abilities, guts, coins, fate, level, derived aura, speed, equipment limits, defense, and equipped item accessors. | `module/data/Actor/Entity.mjs` |
| Hero token resource support | `migrate` | `CONFIG.Actor.trackableAttributes.hero` is configured for token bars/values. | `module/hooks/init.mjs`, `module/data/Actor/Entity.mjs` |
| Geist token resource support | `replace` | No explicit `CONFIG.Actor.trackableAttributes.geist` registration found. | `module/hooks/init.mjs` |

## Item Types

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `weapon` item type | `keep` | Supports quantity, access, cost, traits, range, damage, wear, equipped, and weight. | `system.json`, `module/data/Item/Weapon.mjs` |
| `ammo` item type | `keep` | Supports quantity, access, and cost. | `system.json`, `module/data/Item/Ammo.mjs` |
| `armour` item type | `keep` | Supports protection, locations, equipped state, weight, cost, and access. | `system.json`, `module/data/Item/Armour.mjs` |
| `shield` item type | `keep` | Extends armour behavior with single-shield equip constraint. | `system.json`, `module/data/Item/Shield.mjs` |
| `good` item type | `keep` | Supports quantity, access, cost, and rich-text description. | `system.json`, `module/data/Item/Good.mjs` |
| `skill` item type | `keep` | Supports linked ability, rich-text description, and rank-based advances. | `system.json`, `module/data/Item/Skill.mjs` |
| `craft` item type | `keep` | Extends skill with aspect instead of ability, plus rich-text description and rank-based advances. | `system.json`, `module/data/Item/Craft.mjs` |
| Common item base data | `migrate` | Shared quantity/access/cost schema is already centralized. | `module/data/Item/Common.mjs` |
| Item display helper `quantifiedName` | `keep` | Useful for gear and weapon list rendering. | `module/documents/item.mjs` |
| Equip prompt on embedded armour/weapon creation | `migrate` | Uses `DialogV2.confirm` to ask whether new embedded gear should be equipped. | `module/data/Item/Armour.mjs`, `module/data/Item/Weapon.mjs` |
| Equip-limit enforcement | `migrate` | Prevents over-equipping weapons, overlapping armour slots, and multiple shields. | `module/data/Item/Weapon.mjs`, `module/data/Item/Armour.mjs`, `module/data/Item/Shield.mjs`, `module/data/Actor/Entity.mjs` |

## Sheets and Apps

### Actor Sheets

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `CombinedHeroSheet` | `migrate` | Composite sheet rendering summary, skills, and craft sections in one window. | `module/Apps/ActorSheets/CombinedHeroSheet.mjs`, `templates/Apps/CombinedHeroSheet/*` |
| `StatsCardV1` | `migrate` | Summary card with armour silhouette, fate/advancement, equipped weapons, abilities, guts, and move/run display. | `module/Apps/ActorSheets/StatsCardV1.mjs`, `templates/Apps/StatsCardV1/*` |
| `SkillsCardV1` | `migrate` | Skill lists by ability, gear slots, currencies, ammo summary, favourite ammo, and aura display. | `module/Apps/ActorSheets/SkillsCardV1.mjs`, `templates/Apps/SkillsCardV1/*` |
| `CraftCardV1` | `migrate` | Aspect-based craft lists plus aura display. | `module/Apps/ActorSheets/CraftCardV1.mjs`, `templates/Apps/CraftCardV1/*` |
| Sheet registration by actor type | `migrate` | `hero` has multiple selectable sheets; `geist` uses Stats, Skills, and Craft cards. | `module/hooks/init.mjs` |

### Item Sheets

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `AllItemSheetV1` | `migrate` | Generic form-driven sheet for most item types. | `module/Apps/ItemSheets/AllItemSheetV1.mjs`, `templates/Apps/AllItemSheetV1/*` |
| `ArmourSheet` | `migrate` | Specialized armour/shield sheet with location map and cost block. | `module/Apps/ItemSheets/ArmourSheet.mjs`, `templates/Apps/ArmourSheet/*`, `templates/components/armour-summary.hbs` |
| Item header partial | `keep` | Shared name and quantity header for item sheets. | `templates/Apps/partials/item-header.hbs`, `templates/css/partials/item-header.css` |

### Utility Apps

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `DicePool` app | `migrate` | Roll builder for dice count, target, edge, and drag. | `module/Apps/DicePool.mjs`, `templates/Apps/DicePool/*` |
| `DelveDiceHUD` app | `migrate` | Top HUD for current difficulty, current fate, and Sands of Fate tour tracking. | `module/Apps/DelveDiceHUD.mjs`, `templates/Apps/DelveDiceHUD/*` |
| `RichEditor` app | `migrate` | Separate editor window for rich-text item descriptions via `<prose-mirror>`. | `module/Apps/RichEditor.mjs`, `templates/Apps/RichEditor/*` |
| `AmmoTracker` popover | `migrate` | Hover/click popover for ammo quantities and starred ammo flags. | `module/Apps/popovers/AmmoTracker.mjs`, `templates/Apps/popovers/AmmoTracker/*` |
| Generic app mixin | `keep` | Shared render, action, popover, and context data handling for most custom apps. | `module/Apps/GenericApp.mjs` |
| Generic popover mixin | `migrate` | Shared framed/frameless popover behavior, positioning, and dynamic context hooks. | `module/Apps/popovers/GenericPopoverMixin.mjs` |

## Rolls, Dice, and Chat

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Custom `CryptDie` term | `migrate` | Replaces `CONFIG.Dice.terms.d` and adds Rip/Crypt modifier behavior. | `module/dice/CryptDie.mjs`, `module/hooks/init.mjs` |
| Ability rolls through DicePool | `migrate` | Actor sheet ability buttons open the DicePool app and roll `Xd8rcT`. | `module/Apps/GenericApp.mjs`, `module/Apps/DicePool.mjs`, `templates/Apps/StatsCardV1/content.hbs` |
| Haste check roll | `migrate` | Custom `1d8xo=1` roll tied to Delve Dice HUD and actor sheet button. | `module/Apps/DelveDiceHUD.mjs`, `module/Apps/ActorSheets/StatsCardV1.mjs` |
| Roll difficulty modifiers | `keep` | DicePool supports edge and drag modifiers against a target number. | `module/Apps/DicePool.mjs`, `templates/Apps/DicePool/*` |
| Fate-driven combat initiative | `migrate` | Combatant initiative is derived from fate path distance plus friendly/hostile ordering. | `module/documents/combatant.mjs`, `module/documents/combat.mjs`, `module/utils/fates.mjs` |
| Default Foundry roll messages | `migrate` | Current rolls send standard `Roll#toMessage()` output. | `module/Apps/DicePool.mjs`, `module/Apps/DelveDiceHUD.mjs` |
| Custom chat card template `templates/chat/roll.hbs` | `remove` | Placeholder file contains only `HELLO` and is not wired into any roll workflow. | `templates/chat/roll.hbs` |

## Chat-Adjacent Behavior

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Chat flavor text for DicePool | `migrate` | Adds optional flavor plus localized difficulty suffix. | `module/Apps/DicePool.mjs` |
| Chat flavor text for Haste | `migrate` | Hard-coded `Haste Check` flavor used in roll output. | `module/Apps/DelveDiceHUD.mjs` |
| Socket-driven user notifications | `migrate` | Remote notification system for info/error/success messages. | `module/sockets/_index.mjs`, `module/sockets/notify.mjs` |

## Owned Item and Embedded Workflow

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Create embedded items from actor sheets | `migrate` | Uses `Item.createDialog` with actor parent context and type filters. | `module/Apps/utils.mjs`, actor templates |
| Edit embedded items from actor sheets | `migrate` | Uses context menus and UUID-based lookup to open item sheets. | `module/Apps/utils.mjs`, actor sheet classes |
| Delete embedded items from actor sheets | `migrate` | Uses `deleteDialog()` from actor sheet context menus. | `module/Apps/utils.mjs`, actor sheet classes |
| Weapon equip slots on actors | `keep` | Derived `equippedWeapons` getter and display limited to four slots. | `module/data/Actor/Entity.mjs`, `module/Apps/ActorSheets/StatsCardV1.mjs` |
| Armour and shield equip slots on actors | `keep` | Derived `equippedArmour`, `equippedShield`, and defense-by-location display. | `module/data/Actor/Entity.mjs`, `module/Apps/ActorSheets/StatsCardV1.mjs` |
| Gear list on actors | `keep` | Non-equipped gear shown in fixed slot list. | `module/Apps/ActorSheets/SkillsCardV1.mjs`, `templates/Apps/SkillsCardV1/content.hbs` |
| Favourite ammo flags | `keep` | Ammo items can be starred/unstarred via item flag and shown in favourite slots. | `module/flags/item.mjs`, `module/Apps/popovers/AmmoTracker.mjs`, `module/Apps/ActorSheets/SkillsCardV1.mjs` |
| Foreign embedded-document updates from sheet widgets | `migrate` | Quantity inputs update other documents by UUID/path without opening those sheets. | `module/Apps/utils.mjs`, `module/Apps/GenericApp.mjs`, `module/Apps/popovers/GenericPopoverMixin.mjs` |

## Drag and Drop

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Explicit custom drag/drop handlers | `remove` | No custom actor/item drag/drop workflow was found in the imported codebase. | code search across `module/` and `templates/` |
| Implicit Foundry default document handling | `migrate` | Some drop behavior may still come from Foundry defaults, but the system does not add custom logic for it. | no dedicated implementation found |

## Compendia and Packs

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `protection` item pack | `migrate` | Pack source exists and contains armour/shield items plus folder/category entries. | `system.json`, `packs/protection/_source/*` |
| `weapons` item pack | `migrate` | Pack source exists and contains weapon/ammo items plus folder/category entries. | `system.json`, `packs/weapons/_source/*` |
| `skills` item pack declaration | `remove` | Declared in `system.json` but no `packs/skills` source exists. | `system.json` |
| `geist` actor pack declaration | `remove` | Declared in `system.json` but no `packs/geist` source exists. | `system.json` |
| Pack folder structure in manifest | `migrate` | Manifest defines `RipCrypt Sprint Start` folder with `Character Options` subfolder and `geist` pack placement. | `system.json` |
| Source-only compendium workflow | `migrate` | Uses `_source` JSON plus CLI build/extract scripts instead of committed pack DB files. | `scripts/buildCompendia.mjs`, `scripts/extractCompendia.mjs` |

Pack content visible in source:

- `protection`: armour and shield entries, with category folders such as `Armour`, `Light`, `Modest`, `Heavy`, and `Shields`.
- `weapons`: weapon and ammo entries, with category folders such as `Hand Weapons`, `Ranged Weapons`, `Ammo`, `Light`, `Modest`, and `Heavy`.

## Settings

### World and Meta Settings

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `dc` | `keep` | Stores current default difficulty for DicePool and HUD. | `module/settings/metaSettings.mjs` |
| `sandsOfFate` | `keep` | Tracks current Sands of Fate value and drives HUD animation. | `module/settings/metaSettings.mjs` |
| `currentFate` | `keep` | Tracks current fate ordinal and drives HUD animation/combat behavior. | `module/settings/metaSettings.mjs` |
| `whoFirst` | `keep` | Controls whether friendly or hostile combatants win same-fate tiebreaks. | `module/settings/metaSettings.mjs` |
| `firstLoadFinished` | `migrate` | One-time world bootstrap flag for initial combat tracker defaults. | `module/settings/metaSettings.mjs`, `module/hooks/ready.mjs` |
| `sandsOfFateInitial` | `keep` | Configurable hourglass reset value. | `module/settings/worldSettings.mjs` |
| `onCrypticEvent` | `keep` | Determines notification/pause behavior when Sands of Fate wraps. | `module/settings/worldSettings.mjs` |
| `allowUpdateSandsSocket` | `keep` | Controls whether player haste rolls can update global Sands of Fate through socket flow. | `module/settings/worldSettings.mjs` |

### User and Dev Settings

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `condensedRange` | `keep` | Switches weapon range editing between combined bar input and separate rows. | `module/settings/userSettings.mjs`, `module/data/Item/Weapon.mjs` |
| `devMode` | `keep` | Enables dev-focused UI behaviors and hot-reload helpers. | `module/settings/devSettings.mjs`, `module/hooks/ready.mjs`, `module/hooks/hotReload.mjs` |
| `defaultTab` | `migrate` | Dev/client setting used to force a sidebar tab at ready. | `module/settings/devSettings.mjs`, `module/hooks/ready.mjs` |
| `abbrAccess` | `remove` | Commented as non-functional and not registered. | `module/settings/userSettings.mjs` |

## Hooks and Lifecycle

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `Hooks.once("init")` startup | `migrate` | Central registration point for settings, models, documents, sheets, sockets, helpers, and components. | `module/hooks/init.mjs` |
| `Hooks.once("ready")` startup | `migrate` | Applies first-load core settings, dev behavior, sidebar tab, and renders HUD. | `module/hooks/ready.mjs` |
| `Hooks.on("hotReload")` dev hook | `keep` | Development-only hot reload support for CSS, modules, and SVG assets. | `module/hooks/hotReload.mjs` |
| Custom SVG HMR hook channel | `keep` | `ripcrypt-hmr:svg` style hook used by icon components for SVG refresh. | `module/hooks/hotReload.mjs`, `module/Apps/components/Icon.mjs` |
| Popover context hook channels | `keep` | `prepare${PopoverClassName}Context` and `prepare${managerId}Context` allow dynamic popover data injection. | `module/Apps/popovers/GenericPopoverMixin.mjs`, `module/Apps/ActorSheets/SkillsCardV1.mjs` |
| Combat turn hook emission | `migrate` | Custom combat document calls `Hooks.callAll("combatTurn", ...)` on manual next/previous turn changes. | `module/documents/combat.mjs` |

## CSS and Layout Features

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Dark theme | `keep` | The imported system ships a coherent dark palette with CSS custom properties. | `templates/css/themes/dark.css`, `templates/css/main.css` |
| Light theme scaffold | `remove` | `templates/css/vars.css` references a commented-out light theme only; no active light theme implementation is wired. | `templates/css/vars.css` |
| Layered CSS organization | `keep` | Uses CSS layers for resets, themes, elements, partials, apps, and exceptions. | `templates/css/main.css` |
| Grid-based summary sheet layout | `keep` | Stats card uses fixed grid placement, silhouette display, circular stat widgets, and table-like weapon rows. | `templates/Apps/StatsCardV1/style.css` |
| Grid-based skill card layout | `keep` | Skills card uses fixed column layout, slot lists, pill controls, and aura summary. | `templates/Apps/SkillsCardV1/style.css` |
| Grid-based craft card layout | `keep` | Craft card uses aura graphic, dashed circles, and aspect-based list blocks. | `templates/Apps/CraftCardV1/style.css` |
| Composite combined sheet layout | `migrate` | Combined sheet stitches summary, skills, and craft panels into one scrolling window. | `templates/Apps/CombinedHeroSheet/style.css`, `templates/Apps/CombinedHeroSheet/crafts.css` |
| Dedicated armour sheet layout | `keep` | Uses two-column form layout with location map component and custom border component. | `templates/Apps/ArmourSheet/style.css` |
| Delve Dice HUD layout | `keep` | Top-mounted HUD with central compass and hourglass/difficulty widgets. | `templates/Apps/DelveDiceHUD/style.css` |
| Custom popover styling | `keep` | Frameless popovers use custom border and lock highlighting. | `templates/Apps/popover.css`, `templates/Apps/popovers/AmmoTracker/style.css` |
| Rich text styling | `keep` | ProseMirror content has dedicated exception styling. | `templates/css/elements/prose-mirror.css`, `templates/Apps/RichEditor/style.css` |

## Localization Keys

Top-level language structure in `langs/en-ca.json`:

- `TYPES.Actor`
- `TYPES.Item`
- `RipCrypt.sheet-names`
- `RipCrypt.app-titles`
- `RipCrypt.common`
- `RipCrypt.setting`
- `RipCrypt.Apps`
- `RipCrypt.notifs`
- `RipCrypt.tooltips`
- `USER`

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Actor and item subtype names | `keep` | `TYPES.Actor.*` and `TYPES.Item.*` are already present. | `langs/en-ca.json` |
| Sheet names | `keep` | Localized labels exist for registered actor and item sheets. | `langs/en-ca.json`, `module/hooks/init.mjs` |
| Common rules/UI terms | `keep` | Abilities, anatomy, aspects, rank names, currencies, equipment terms, and difficulties are localized. | `langs/en-ca.json` |
| Settings labels and hints | `keep` | World and user settings have localized names/hints. | `langs/en-ca.json`, `module/settings/*.mjs` |
| App-specific text | `keep` | DicePool, RichEditor, ammo tracker, and location prompts have localized keys. | `langs/en-ca.json` |
| Notifications and tooltips | `keep` | Error/warn/info strings and most tooltips are localized. | `langs/en-ca.json` |
| Recursive localization helper | `keep` | Supports `@Subkey` substitution inside localized strings. | `module/utils/Localizer.mjs` |
| Hard-coded visible strings | `replace` | Several templates and JS paths still hard-code labels such as `Hero`, `Haste Check`, `Target`, `Roll`, `Text Editor`, and `Equip Item?`. | actor/item templates, `module/Apps/*.mjs`, `module/data/Item/*.mjs` |
| Missing explicit `Name` system key | `replace` | Templates call `rc-i18n "Name"` but the system language file does not define a `RipCrypt`-namespaced equivalent. | item templates, `langs/en-ca.json` |

## Custom Utilities, Helpers, and Components

### Helpers and Utilities

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `filePath()` | `keep` | Builds system-relative asset/template paths. | `module/consts.mjs` |
| `toBoolean()` | `keep` | Converts dataset values into booleans for action handling. | `module/consts.mjs` |
| `documentSorter()` | `keep` | Sorts skill/craft display rows by sort order and name. | `module/consts.mjs` |
| `getTooltipDelay()` | `keep` | Reads Foundry tooltip activation timing for popover behavior. | `module/consts.mjs` |
| `Localizer` helpers | `keep` | Includes `localizer()` and Handlebars-facing `handlebarsLocalizer()`. | `module/utils/Localizer.mjs`, `module/handlebarHelpers/_index.mjs` |
| `Logger` proxy | `keep` | Prefixes console output with system id. | `module/utils/Logger.mjs` |
| Fate utilities | `keep` | Implements opposite-fate checks, distance, next fate, and previous fate. | `module/utils/fates.mjs` |
| `rankToInteger()` | `keep` | Converts rank names into numeric values for aura calculations. | `module/utils/rank.mjs` |
| `clamp()` and `sumReduce()` | `keep` | Small shared numeric utilities. | `module/utils/clamp.mjs`, `module/utils/sumReduce.mjs` |
| App document helpers | `keep` | Centralized item create/edit/delete and foreign document update helpers. | `module/Apps/utils.mjs` |
| Global API object | `keep` | Exposes selected apps, utilities, and item flags on `globalThis.ripcrypt`. | `module/api.mjs` |

### Handlebars Input Helpers

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `rc-formFields` | `keep` | Renders form definitions from item data models into HTML controls. | `module/handlebarHelpers/inputs/formFields.mjs` |
| `rc-options` | `keep` | Renders `<option>` lists with optional localization. | `module/handlebarHelpers/options.mjs` |
| `rc-empty-state` | `keep` | Fallback display helper for empty values. | `module/handlebarHelpers/_index.mjs` |
| Input renderers | `keep` | Custom renderers exist for boolean, integer, dropdown, text, bar, group, currency, string-set, and prose-mirror controls. | `module/handlebarHelpers/inputs/*.mjs` |

### Custom Elements and UI Components

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| `rc-icon` | `migrate` | Shadow-DOM icon component that fetches SVG assets and supports HMR. | `module/Apps/components/Icon.mjs`, `templates/css/components/icon.css` |
| `rc-svg` | `migrate` | Alias/variant of the icon component for larger SVG artwork. | `module/Apps/components/svgLoader.mjs`, `templates/css/components/svg-loader.css` |
| `rc-border` | `keep` | Reusable bordered container with title/content slots. | `module/Apps/components/RipCryptBorder.mjs`, `templates/css/components/rc-border.css` |
| `armour-summary` | `migrate` | Custom element rendering the armour slot silhouette and slot labels. | `module/Apps/components/ArmourSummary.mjs`, `templates/components/armour-summary.hbs` |
| Styled shadow-element mixin | `migrate` | Shared shadow DOM/CSS loader for all custom elements. | `module/Apps/components/mixins/StyledShadowElement.mjs` |
| Custom element registration | `migrate` | Registers components during init with `customElements.define`; current components are not form-associated and no longer write to `CONFIG.CACHE`. | `module/Apps/components/_index.mjs` |

## Notable Partial or Placeholder Features

| Feature | Status | Notes | Key files |
| --- | --- | --- | --- |
| Actor coin editing in Skills card | `replace` | UI exists, but coin inputs are hard-coded to `0` and lack `name` attributes, so they do not persist. | `templates/Apps/SkillsCardV1/content.hbs` |
| Empty fate dropdown option wiring | `replace` | Fate option builder uses `v` instead of `value` for the empty choice. | `module/Apps/ActorSheets/StatsCardV1.mjs` |
| Light theme mention in README | `remove` | README claims a light theme, but active CSS only wires the dark theme. | `README.md`, `templates/css/vars.css` |
| Custom chat template | `keep` | Template is used by RipCrypt roll output and should be verified during v14 chat rendering tests. | `templates/chat/roll.hbs`, `module/rolls/ripcrypt-rolls.mjs` |

## Recommended Inventory Interpretation

For the v14 migration, the dominant pattern is:

- `keep` the game-facing taxonomy: actor types, item types, pack organization, language namespaces, and overall sheet/layout concepts.
- `migrate` the existing implementations that already express the intended RipCrypt workflows: sheets, data models, HUD, dice pool, sockets, item workflows, settings, and utilities.
- `replace` partial or placeholder implementations: missing/incorrect field persistence, hard-coded strings, inactive light theme claim, and any workflow that only exists as a stub.
- `remove` stale declarations or dead placeholders: missing pack declarations, commented-out non-functional settings, and unused chat-card scaffolding.
