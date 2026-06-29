# RipCrypt Mechanics Spec

Date: 2026-06-29

Scope: mechanics currently implemented in the imported Foundry system during the v13-to-v14 migration. This file documents existing behavior and assumptions; it is not a complete rules reference.

## Roll API Migration

Roll construction now lives in `module/rolls/ripcrypt-rolls.mjs` so sheet and app classes call shared roll helpers instead of directly owning formulas and chat-message creation.

Chat messages now render through `templates/chat/roll.hbs`, using Foundry's standard dice-roll structure plus a localized Rip/Crypt status label when the custom die marks the roll.

## RipCrypt Dice Pool

Current formula:

```text
Xd8rcT
```

Where:

- `X` is the number of d8s.
- `T` is the effective target after edge and drag.
- Effective target is `max(base target - edge + drag, 1)`.
- The DicePool UI displays the base difficulty in chat flavor, preserving the imported behavior.

The custom `rc` die modifier is implemented by `CryptDie`.

## Rip And Crypt Behavior

Current `CryptDie` behavior:

- A result of `8` explodes recursively and marks the die as `ripping`.
- A die only checks for crypting if it is not already ripping.
- Crypting uses a single explosion on `1`.
- If the original roll and the single exploded roll are both `1`, the die is marked `crypted`.
- Successes are counted with Foundry's success-count modifier using `cs>=T`.
- The die total clamps to a minimum of `0`.

Rulebook assumption:

- This preserves the imported implementation's interpretation that ripping and crypting are mutually exclusive for a die.
- This preserves the imported implementation's success-count behavior after rip/crypt processing.
- A future rulebook QA pass should confirm whether a crypted die should only remove that die's successes or alter the whole pool result.

## Haste Check

Current formula:

```text
1d8xo=1
```

Current behavior:

- If the first d8 does not explode on `1`, Sands of Fate delta is `0`.
- If the first d8 explodes on `1`, Sands of Fate delta is `-1`.
- If the first d8 and the single exploded d8 are both `1`, Sands of Fate delta is `-2`.
- Haste rolls post through the shared RipCrypt chat-card renderer with localized flavor `RipCrypt.Apps.haste-check`.
- Sands of Fate is updated only when `ripcrypt.allowUpdateSandsSocket` is enabled.
- If the current user is not the active GM, the update is sent through the existing `system.ripcrypt` socket flow.

Rulebook assumption:

- This preserves the imported v13 behavior for Haste and Sands of Fate automation.

## Chat Speaker Behavior

Current behavior:

- Ability rolls launched from actor sheets pass that actor into the DicePool.
- DicePool chat messages use that actor as the chat speaker when available.
- Haste checks launched from an actor sheet use that actor as the chat speaker when available.
- Rolls without an actor fall back to Foundry's default `ChatMessage.getSpeaker()` behavior.

## Combat Initiative

Combat does not use Foundry `Roll` objects for initiative. Current behavior is deterministic:

- Each combatant's `dynamicInitiative` is the distance from the current Fate setting to the combatant actor's Fate.
- If the `whoFirst` setting is set, the combatant's token disposition adds a tie-break offset.
- Sorting falls back to combatant name when dynamic initiative ties.

Rulebook assumption:

- This documents the imported behavior only. The grouped-turn/token-marker implementation still needs separate v14 runtime validation.

## Known Follow-Ups

- Confirm the rip/crypt interpretation against the RipCrypt Digital Core Rulebook.
- Confirm custom `CryptDie` tooltips in Foundry v14.
- Confirm the localized Rip/Crypt state labels and chat card styling in Foundry v14.
