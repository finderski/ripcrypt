import { gameTerms } from "../gameTerms.mjs";
import { localizer } from "./Localizer.mjs";

const { DialogV2 } = foundry.applications.api;
const { Roll } = foundry.dice;
const { escapeHTML } = foundry.utils;

export const WeaponAttackAbilities = Object.freeze([
	gameTerms.Abilities.GRIT,
	gameTerms.Abilities.GAIT,
	gameTerms.Abilities.GRIP,
	gameTerms.Abilities.GLIM,
]);

const HitLocationTable = Object.freeze([
	{ max: 2, location: gameTerms.Anatomy.LEGS },
	{ max: 4, location: gameTerms.Anatomy.ARMS },
	{ max: 7, location: gameTerms.Anatomy.BODY },
	{ max: 8, location: gameTerms.Anatomy.HEAD },
]);

export function isWeaponAttackAbility(value) {
	return WeaponAttackAbilities.includes(value);
};

export function getWeaponAttackAbilityName(value) {
	if (!isWeaponAttackAbility(value)) { return String(value ?? ``) };
	return localizer(`RipCrypt.common.abilities.${value}`);
};

export function getWeaponHitLocationName(value) {
	if (!Object.values(gameTerms.Anatomy).includes(value)) { return String(value ?? ``) };
	return localizer(`RipCrypt.common.anatomy.${value}`);
};

function getWeaponHitLocationFromTotal(total) {
	const numericTotal = Number(total);
	for (const entry of HitLocationTable) {
		if (numericTotal <= entry.max) { return entry.location };
	};
	return gameTerms.Anatomy.BODY;
};

function getSelectedWeaponAttackTarget() {
	const targets = [...game.user.targets];
	if (targets.length === 0) { return null };

	if (targets.length > 1) {
		ui.notifications.warn(localizer(`RipCrypt.notifs.warn.weapon-attack-multiple-targets`));
	};

	const token = targets[0];
	const actor = token?.actor ?? null;
	if (!(actor instanceof Actor)) {
		ui.notifications.warn(localizer(`RipCrypt.notifs.warn.weapon-attack-invalid-target`));
		return null;
	};

	return {
		token,
		actor,
		name: token.name || actor.name,
		tokenUuid: token.document?.uuid ?? null,
		actorUuid: actor.uuid ?? null,
	};
};

async function chooseHeroicHitLocation({ actorName, targetName, weaponName } = {}) {
	const content = localizer(`RipCrypt.Apps.heroic-hit-location-prompt`, {
		actorName: actorName ?? ``,
		targetName: targetName ?? ``,
		weaponName: weaponName ?? ``,
	});

	const buttons = Object.values(gameTerms.Anatomy).map(location => ({
		action: location,
		label: getWeaponHitLocationName(location),
		callback: () => location,
		default: location === gameTerms.Anatomy.BODY,
	}));

	const location = await DialogV2.wait({
		window: { title: localizer(`RipCrypt.Apps.heroic-hit-location-title`) },
		content: `<p>${escapeHTML(content)}</p>`,
		buttons,
		modal: true,
		rejectClose: false,
		close: () => gameTerms.Anatomy.BODY,
	});

	return {
		location,
		method: `chosen`,
		roll: null,
	};
};

async function rollWeaponHitLocation() {
	const roll = new Roll(`1d8`);
	await roll.evaluate();

	return {
		location: getWeaponHitLocationFromTotal(roll.total),
		method: `rolled`,
		roll: {
			formula: roll.formula,
			total: roll.total,
		},
	};
};

export async function buildWeaponAttackChatData({
	actor,
	weapon,
	roll,
	baseTarget,
	effectiveTarget,
} = {}) {
	const totalSuccesses = Math.max(Number(roll?.total ?? 0), 0);
	const baseDamage = Math.max(Number(weapon?.system?.damage ?? 0), 0);
	const extraSuccesses = Math.max(totalSuccesses - 1, 0);
	const rawDamage = baseDamage + extraSuccesses;

	const attack = {
		actorName: actor?.name ?? ``,
		weaponName: weapon?.name ?? ``,
		abilityName: getWeaponAttackAbilityName(weapon?.system?.attackAttribute),
		totalSuccesses,
		baseDamage,
		extraSuccesses,
		rawDamage,
		appliedDamage: 0,
		armour: 0,
		applied: false,
	};

	const target = getSelectedWeaponAttackTarget();
	if (!target) {
		attack.noTargetMessage = localizer(`RipCrypt.chat.weapon.no-target`);
		return {
			baseTarget,
			effectiveTarget,
			showOutcomeLabel: true,
			weaponAttack: attack,
		};
	};

	attack.targetName = target.name;
	attack.targetTokenUuid = target.tokenUuid;
	attack.targetActorUuid = target.actorUuid;

	if (totalSuccesses <= 0) {
		return {
			baseTarget,
			effectiveTarget,
			showOutcomeLabel: true,
			weaponAttack: attack,
		};
	};

	const hitLocation = totalSuccesses >= 3
		? await chooseHeroicHitLocation({
			actorName: attack.actorName,
			targetName: attack.targetName,
			weaponName: attack.weaponName,
		})
		: await rollWeaponHitLocation();

	attack.hitLocation = hitLocation.location;
	attack.hitLocationLabel = getWeaponHitLocationName(hitLocation.location);
	attack.hitLocationMethod = hitLocation.method;
	attack.hitLocationRoll = hitLocation.roll;

	const armour = Number(target.actor.system.defense?.[hitLocation.location] ?? 0);
	attack.armour = Number.isFinite(armour) ? armour : 0;
	attack.appliedDamage = Math.max(rawDamage - attack.armour, 0);

	if (attack.appliedDamage <= 0) {
		attack.noDamageMessage = localizer(`RipCrypt.chat.weapon.no-damage-penetrates`, {
			targetName: attack.targetName,
			locationName: attack.hitLocationLabel,
		});
	};

	return {
		baseTarget,
		effectiveTarget,
		showOutcomeLabel: true,
		weaponAttack: attack,
	};
};

export async function resolveWeaponAttackTargetActor(attack = {}) {
	const tokenDocument = attack.targetTokenUuid ? await fromUuid(attack.targetTokenUuid) : null;
	const tokenActor = tokenDocument?.actor;
	if (tokenActor instanceof Actor) { return tokenActor };

	const actor = attack.targetActorUuid ? await fromUuid(attack.targetActorUuid) : null;
	return actor instanceof Actor ? actor : null;
};

function resolveTargetElement(target) {
	if (target instanceof HTMLElement) { return target };
	if (target?.currentTarget instanceof HTMLElement) { return target.currentTarget };
	if (target?.target instanceof HTMLElement) { return target.target };
	return null;
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
	target = resolveTargetElement(target);
	if (!target) { return buildWeaponAttackRollData(null, null) };

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
