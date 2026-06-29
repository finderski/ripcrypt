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

### Item fields

- [ ] Edit common item fields such as quantity, access, and cost where applicable.
- [ ] Edit weapon traits, ranges, wear, weight, and equipped state where applicable.
- [ ] Edit armour or shield protection, locations, weight, and equipped state.
- [ ] Edit skill ability and advances.
- [ ] Edit craft aspect and advances.
- [ ] Edit rich text descriptions for `good`, `skill`, and `craft`.
- [ ] Close and reopen item sheets and confirm values persist.

Record:

- Result:
- Console warnings/errors:

## Roll And Chat Smoke Test

Checklist:

- [ ] Open the Dice Pool app from an actor workflow that uses it.
- [ ] Roll an ability check and confirm chat message creation succeeds.
- [ ] Confirm the roll formula parses and evaluates.
- [ ] Inspect the roll tooltip for obvious custom die errors.
- [ ] Trigger a Haste check from the Delve Dice HUD or sheet control.
- [ ] Confirm the Haste roll posts to chat.
- [ ] Confirm chat speaker assignment is correct or at least non-fatal.
- [ ] Confirm no roll or chat action throws in the console.

Known watch items from the audit:

- `DicePool.#roll` currently uses `ChatMessage.getSpeaker({ actor: this.actor })`, which may be undefined.
- `templates/chat/roll.hbs` is currently a placeholder and is not expected to render custom roll cards yet.

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
