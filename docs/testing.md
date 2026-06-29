# RipCrypt Foundry VTT v14 Testing

Date: 2026-06-29

Purpose:

- Provide a repeatable Foundry VTT v14 smoke test for the migrated RipCrypt system.
- Record package-load results, workflow regressions, and v13-to-v14 migration failures as they are discovered.

Scope:

- Package install/link
- World creation
- Actor and item creation
- Sheet opening and basic interaction
- Field persistence
- Roll and chat behavior
- Compendium visibility
- Browser console checks

This document is a running test log template. It does not claim that the checks below have already passed.

## Test Environment

Record these before each meaningful test run:

- Foundry VTT version:
- Browser and version:
- OS:
- RipCrypt branch or commit:
- Installation mode:
  - local system folder copy
  - linked development workspace
- Notes:

## Install Or Link

Choose one setup path.

### Option A - Linked development workspace

Use when testing the current repo directly.

1. Set `FOUNDRY_ROOT` to the Foundry installation or app root expected by `scripts/linkFoundry.mjs`.
2. Run `npm install` if dependencies are not already present.
3. Run `npm run link`.
4. Confirm the local `foundry` symlink exists and points at the intended Foundry root.
5. Confirm this system folder is available under Foundry's `Data/systems/ripcrypt` path, either directly or through your local dev setup.

### Option B - Manual local system install

Use when testing without the link script.

1. Place this repo at `Data/systems/ripcrypt`.
2. Start Foundry VTT v14.
3. Confirm `RipCrypt` appears in the systems list without a compatibility rejection.

## Package Load Smoke Test

- [ ] Start Foundry VTT v14.
- [ ] Confirm `RipCrypt` appears as a compatible system package.
- [ ] Open package details and confirm the system metadata loads without manifest errors.
- [ ] Confirm no immediate console errors appear on the Setup screen.
- [ ] If the system is installed by manifest URL, confirm the manifest resolves and the package installs.

Record:

- Result:
- Console warnings/errors:

## World Creation Smoke Test

- [ ] Create a new world using the `RipCrypt` system.
- [ ] Launch the world successfully.
- [ ] Confirm the world reaches the main UI without a fatal startup error.
- [ ] Confirm the custom system initialization completes.
- [ ] Confirm the browser console has no blocking load errors.

Record:

- Result:
- Console warnings/errors:

## Actor Creation Smoke Test

Test both declared actor types:

- `hero`
- `geist`

Checklist:

- [ ] Create a `hero` actor from the directory.
- [ ] Create a `geist` actor from the directory.
- [ ] Re-open both actors from the sidebar after creation.
- [ ] Confirm actor creation does not trigger DataModel validation errors.
- [ ] Confirm actor sheet registration resolves to the expected default sheet.

Record:

- Result:
- Console warnings/errors:

## Item Creation Smoke Test

Test all declared item types:

- `ammo`
- `armour`
- `craft`
- `good`
- `shield`
- `skill`
- `weapon`

Checklist:

- [ ] Create one world item of each declared type.
- [ ] Re-open each item from the sidebar after creation.
- [ ] Confirm item creation does not trigger DataModel validation errors.
- [ ] Confirm `armour` and `shield` use the specialized armour sheet.
- [ ] Confirm the remaining types open their expected generic item sheet.

Record:

- Result:
- Console warnings/errors:

## Sheet Opening Smoke Test

Actor sheets to verify:

- `CombinedHeroSheet`
- `StatsCardV1`
- `SkillsCardV1`
- `CraftCardV1`

Item sheets to verify:

- `AllItemSheetV1`
- `ArmourSheet`

Checklist:

- [ ] Open each actor sheet type that is registered for `hero`.
- [ ] Open each actor sheet type that is registered for `geist`.
- [ ] Open `AllItemSheetV1` for a non-armour item.
- [ ] Open `ArmourSheet` for both `armour` and `shield`.
- [ ] Confirm templates render without missing partial/helper errors.
- [ ] Confirm CSS and local assets load without 404s.
- [ ] Confirm no sheet open action throws in the console.
- [ ] Confirm render-time listeners do not multiply after closing and reopening the same sheet several times.

Record:

- Result:
- Console warnings/errors:

## Field Persistence Smoke Test

### Actor fields

- [ ] Edit actor `name`.
- [ ] Edit `system.fate`.
- [ ] Edit `system.level.glory`.
- [ ] Edit `system.level.step`.
- [ ] Edit `system.level.rank`.
- [ ] Edit `system.ability.grit`.
- [ ] Edit `system.ability.gait`.
- [ ] Edit `system.ability.grip`.
- [ ] Edit `system.ability.glim`.
- [ ] Edit `system.guts.value`.
- [ ] Edit coin fields if and when they are wired to `system.coin.gold`, `system.coin.silver`, and `system.coin.copper`.
- [ ] Close and reopen the actor sheet and confirm values persist.
- [ ] Reload the world and confirm edited actor values still persist.

### Item fields

- [ ] Edit common item fields such as quantity, access, and cost where applicable.
- [ ] Edit weapon traits, ranges, wear, weight, and equipped state where applicable.
- [ ] Edit armour or shield protection, locations, weight, and equipped state.
- [ ] Edit skill ability and advances.
- [ ] Edit craft aspect and advances.
- [ ] Edit rich text descriptions for `good`, `skill`, and `craft`.
- [ ] Clear and re-set optional item fields such as weight and confirm empty values do not save as the literal string `null`.
- [ ] Close and reopen item sheets and confirm values persist.
- [ ] Reload the world and confirm edited item values still persist.

### Embedded item update paths

- [ ] From the Stats card weapon add control, create embedded `weapon` and `ammo` items and confirm they are created on the actor, not in the world item directory.
- [ ] From the Skills card skill add controls, create embedded `skill` items and confirm they land in the expected ability list after save/reopen.
- [ ] From the Skills card gear add control, create embedded `ammo`, `armour`, `good`, `shield`, and `weapon` items and confirm they appear in the gear list unless immediately equipped elsewhere.
- [ ] Confirm create-item controls do nothing for a non-owner user and do not create stray world items.
- [ ] Open an embedded item from an actor sheet context menu and confirm the correct item sheet opens.
- [ ] Confirm edit and delete context-menu actions are only offered on populated owned-item rows or slots.
- [ ] Delete an embedded item from an actor sheet context menu and confirm the actor sheet rerenders cleanly.
- [ ] Delete an equipped weapon, armour piece, and shield and confirm the actor summary clears the corresponding display slot after reopen.
- [ ] Update embedded ammo quantity through the ammo popover and confirm the backing item persists after closing and reopening the actor sheet.
- [ ] Clear an ammo quantity input on the Skills card or AmmoTracker, blur the field, and confirm the UI restores the prior value instead of throwing a DataModel validation error.
- [ ] Toggle ammo favourite and unfavourite controls and confirm the favourite slots update without console errors.
- [ ] Toggle embedded `equipped` fields for weapons, armour, and shields and confirm the actor sheet rerenders to reflect the new state.
- [ ] Equip and unequip a weapon from its embedded item sheet and confirm it moves between the Skills card gear list and the Stats card weapon table.
- [ ] Equip and unequip armour or shield from its embedded item sheet and confirm defense values and shield markers on the Stats card update after save/reopen.

Record:

- Result:
- Console warnings/errors:

## Roll And Chat Smoke Test

Checklist:

- [ ] Open the Dice Pool app from an actor workflow that uses it.
- [ ] Roll an ability check and confirm chat message creation succeeds.
- [ ] Confirm the roll formula parses and evaluates.
- [ ] Inspect the roll tooltip for obvious custom die errors.
- [ ] Confirm the RipCrypt roll card renders the formula, tooltip, and total cleanly in chat.
- [ ] Confirm Rip or Crypt state badges appear only when the custom die logic sets them.
- [ ] Trigger a Haste check from the Delve Dice HUD or sheet control.
- [ ] Confirm the Haste roll posts to chat.
- [ ] Confirm the Haste card renders cleanly and does not show a Rip/Crypt state badge.
- [ ] Confirm chat speaker assignment is correct or at least non-fatal.
- [ ] Confirm no roll or chat action throws in the console.

Known watch items from the audit:

- DicePool speaker handling now receives the actor from the sheet action when available; confirm chat messages show the expected speaker.
- `templates/chat/roll.hbs` now drives the custom RipCrypt chat card; confirm it loads without missing-template errors.

Record:

- Result:
- Console warnings/errors:

## Compendium Visibility Smoke Test

Declared packs to verify:

- `protection`
- `weapons`

Checklist:

- [ ] Open the Compendiums tab.
- [ ] Confirm `Armour & Shields` appears.
- [ ] Confirm `Weapons & Ammo` appears.
- [ ] Open each pack.
- [ ] Open at least one entry from each pack.
- [ ] Import at least one entry from each pack into the world.
- [ ] Confirm pack entry open/import actions do not throw validation errors.
- [ ] Drag a compendium item onto an actor and confirm the default Foundry embedded-item flow still works.

Record:

- Result:
- Console warnings/errors:

## Browser Console Checks

Check the browser console at each stage above and classify findings:

- fatal:
  - blocks package load, world launch, actor/item creation, or sheet open
- major:
  - workflow proceeds but data is broken, lost, or rendered incorrectly
- minor:
  - warnings, deprecated paths, non-blocking UI glitches

Minimum console checkpoints:

- [ ] Setup screen after package recognition
- [ ] World launch
- [ ] Actor creation
- [ ] Item creation
- [ ] Actor sheet open
- [ ] Item sheet open
- [ ] Roll/chat actions
- [ ] Compendium open/import
- [ ] Embedded item create/edit/delete actions
- [ ] Ammo popover quantity and favourite actions
- [ ] Repeated open/close of actor and item sheets

## Settings, Hooks, And Initialization

Checklist:

- [ ] Confirm startup logs `ripcrypt | Initializing` before document, sheet, socket, component, and helper-dependent workflows run.
- [ ] Confirm startup logs `ripcrypt | Ready` after the world UI loads.
- [ ] Confirm no missing Handlebars helper or missing template errors appear for preloaded app, component, or chat templates.
- [ ] Confirm the Delve Dice HUD appears once, not zero times or duplicated, after world launch.
- [ ] Change the hidden `dc` setting from the console and confirm the HUD difficulty part updates or fails harmlessly if the HUD is not rendered.
- [ ] Change `sandsOfFate` and `currentFate` from the console and confirm the HUD animates or fails harmlessly before render.
- [ ] Change `whoFirst` through the combat tracker control and confirm the combat tracker rerenders without console errors.
- [ ] Open Configure Settings and verify user-facing RipCrypt settings show localized labels and option text.
- [ ] Change `condensedRange`, close settings, reopen a weapon item, and confirm range display behavior follows the setting.
- [ ] Change `sandsOfFateInitial`, then confirm `sandsOfFate` clamps down when the new initial value is below the current value.
- [ ] Change `onCrypticEvent` and confirm each option persists after settings close/reopen.
- [ ] Change `allowUpdateSandsSocket` and confirm Haste rolls respect the setting.
- [ ] On a first-load development world, confirm RipCrypt writes the default turn-marker image without corrupting the core combat tracker config.
- [ ] Reload the world after `firstLoadFinished` is true and confirm the turn-marker default update does not run repeatedly.
- [ ] Confirm custom elements (`rc-icon`, `rc-svg`, `rc-border`, `armour-summary`) render without relying on `CONFIG.CACHE.componentListeners`.
- [ ] Confirm the `hotReload` hook is harmless when Foundry is not running in a hot-reload development mode.

## Sheet Interaction And Drag/Drop

Actor sheets now use Foundry v14 `ActorSheetV2` drag/drop flows with a narrow RipCrypt guard layer: owned items are exposed as draggable rows, Item drops are allowed, and unsupported document drops should warn instead of failing silently.

Checklist:

- [ ] Drag a world item onto a hero actor and confirm it embeds successfully.
- [ ] Drag a world item onto a geist actor and confirm it embeds successfully where the item type is allowed.
- [ ] Drag a compendium item onto a hero actor and confirm it embeds successfully.
- [ ] Drag an owned skill to a new position within the same skill list and confirm the sort order persists after closing and reopening the sheet.
- [ ] Drag an owned craft to a new position within the same craft list and confirm the sort order persists after closing and reopening the sheet.
- [ ] Drag an owned weapon or gear item to a new position where that list supports sorting and confirm the actor display updates after reopen.
- [ ] Drop an unsupported document type, such as an Actor or Folder, onto an actor sheet and confirm a warning is shown instead of a silent failure or console error.
- [ ] Re-open the same actor sheet multiple times, use item controls, and confirm a single click performs a single action.
- [ ] Re-open the ammo popover multiple times and confirm quantity updates and star toggles happen once per interaction.

## Migration Failures Log

Use this section to record v13-to-v14 migration failures actually observed during testing.

If no failures have been observed yet, write `None recorded yet`.

| Date | Foundry v14 version | Area | Severity | Reproduction | Expected | Actual | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-29 |  |  |  |  |  |  | open | None recorded yet |

## Audit Watchlist

These are not confirmed failures. They are the highest-value areas to watch while running the smoke tests:

- `system.json` style entry uses object form and still needs runtime confirmation in v14.
- `CONFIG.Actor.trackableAttributes` currently only defines `hero`, not `geist`.
- Item schema fields using `options` instead of `choices` may fail validation in v14.
- `SetField` cleaning for weapon traits and armour locations needs runtime verification.
- Actor coin inputs are known to be incomplete in the imported sheet implementation.
- Combat and token turn-marker overrides still rely on protected or internal APIs.
- Delve Dice HUD rendering and settings callbacks need confirmation in v14 ready-time execution.
- Template preloading should be verified in the browser console because the code falls back gracefully if the public preloader is unavailable.
- The first-load turn-marker default update should be verified against the v14 `core.combatTrackerConfig` shape.

## Test Run Summary

Fill this after each smoke pass:

- Date:
- Foundry VTT version:
- Package load:
- World creation:
- Actor creation:
- Item creation:
- Sheet opening:
- Field persistence:
- Roll/chat:
- Compendia:
- Console status:
- New failures logged:
