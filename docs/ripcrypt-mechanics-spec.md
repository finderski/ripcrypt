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

- Each initial pool die that rolls `8` counts as `+1` success and rerolls recursively until a non-`8` is rolled.
- Additional rip-chain results count as successes only when they meet or exceed the target number.
- A `1` rolled as part of a rip chain does not count as a failure and does not trigger crypting.
- Each initial pool die that rolls `1` counts as `-1` success and rerolls once for a crypt check.
- The crypt check only marks the die as `crypted` when the reroll is also `1`; any other crypt-check reroll result is ignored for success counting.
- Pool total clamps to a minimum of `0`.

Rulebook assumption:

- This follows the rule clarification used in migration QA: only initial-pool `1`s deduct success, and only those `1`s make a single crypt check.
- Crypt state is exposed in chat, but automatic weapon-wear or dire-failure automation is still not applied here.

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

## Weapon Attack Workflow

Current behavior:

- Weapon items now store `system.attackAttribute`.
- Valid weapon attack attributes are the actor ability fields `grit`, `gait`, `grip`, and `glim`.
- Triggering an attack from an equipped weapon opens the DicePool with dice count taken from the owning actor's matching ability value.
- Weapon attacks default to the current global difficulty, but the DicePool remains editable so the user can choose a different target before rolling.
- Weapon attack chat flavor includes actor name, weapon name, and the configured attack attribute label.

Rulebook assumption:

- The imported system did not previously encode a weapon attack attribute, so the new field defaults to `grip` as a conservative physical-attack baseline until specific weapons are configured.

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
