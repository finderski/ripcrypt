import { gameTerms } from "../gameTerms.mjs";
import { localizer } from "./Localizer.mjs";

export const WeaponAttackAbilities = Object.freeze([
	gameTerms.Abilities.GRIT,
	gameTerms.Abilities.GAIT,
	gameTerms.Abilities.GRIP,
	gameTerms.Abilities.GLIM,
]);

export function isWeaponAttackAbility(value) {
	return WeaponAttackAbilities.includes(value);
};

export function getWeaponAttackAbilityName(value) {
	if (!isWeaponAttackAbility(value)) { return String(value ?? ``) };
	return localizer(`RipCrypt.common.abilities.${value}`);
};

export function buildWeaponAttackRollData(actor, weapon) {
	if (!(actor instanceof Actor)) {
		ui.notifications.warn(localizer(`RipCrypt.notifs.warn.weapon-attack-missing-actor`));
		return null;
	};

	if (!(weapon instanceof Item) || weapon.type !== `weapon`) {
		ui.notifications.warn(localizer(`RipCrypt.notifs.warn.weapon-attack-missing-weapon`));
		return null;
	};

	const attackAttribute = weapon.system.attackAttribute;
	if (!isWeaponAttackAbility(attackAttribute)) {
		ui.notifications.warn(localizer(
			`RipCrypt.notifs.warn.weapon-attack-invalid-attribute`,
			{ weaponName: weapon.name },
		));
		return null;
	};

	const diceCount = Number(actor.system.ability?.[attackAttribute]);
	if (!Number.isFinite(diceCount)) {
		ui.notifications.warn(localizer(
			`RipCrypt.notifs.warn.weapon-attack-invalid-dice`,
			{
				actorName: actor.name,
				weaponName: weapon.name,
				abilityName: getWeaponAttackAbilityName(attackAttribute),
			},
		));
		return null;
	};

	const abilityName = getWeaponAttackAbilityName(attackAttribute);
	return {
		actor,
		weapon,
		attackAttribute,
		abilityName,
		diceCount,
		target: game.settings.get(`ripcrypt`, `dc`) ?? 1,
		flavor: localizer(`RipCrypt.Apps.weapon-attack-roll`, {
			actorName: actor.name,
			weaponName: weapon.name,
			abilityName,
		}),
	};
};

export async function buildWeaponAttackRollDataFromElement(target, { parent } = {}) {
	const itemEl = target.closest(`[data-item-id]`);
	const itemUuid = itemEl?.dataset.itemId;

	let weapon = itemUuid ? await fromUuid(itemUuid) : null;
	if (!weapon && parent instanceof Item && parent.type === `weapon`) {
		weapon = parent;
	};

	const actor = parent instanceof Actor
		? parent
		: (weapon?.parent instanceof Actor ? weapon.parent : null);

	return buildWeaponAttackRollData(actor, weapon);
};
