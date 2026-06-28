# RipCrypt Foundry v14 Technical Plan

## Current Milestone

Create the initial Foundry VTT v14 system scaffold and a working character actor sheet.

## Planned Actor Types

- character
- npc/adversary, if needed after rules review

## Planned Item Types

To be confirmed from the rulebook. Likely candidates:

- weapon
- armor
- gear
- ability/talent
- spell/power, if RipCrypt uses them

## Implementation Notes

- Register Actor and Item DataModels during init.
- Use Actor/Item document classes only where behavior is needed.
- Put derived values in prepareDerivedData().
- Keep templates simple and localized.
- Use CSS classes prefixed with `ripcrypt-`.

## Testing Checklist

After each meaningful change:

1. Launch Foundry v14.
2. Enable the RipCrypt system.
3. Create a world using the system.
4. Create a Character actor.
5. Open the character sheet.
6. Confirm all form fields save and reload.
7. Confirm rolls post to chat.
8. Check browser console for errors.