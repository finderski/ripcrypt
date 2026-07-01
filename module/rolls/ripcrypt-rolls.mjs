import { filePath } from "../consts.mjs";
import {
	buildWeaponAttackChatData,
	resolvePendingWeaponAttackChatData,
	resolveWeaponAttackTargetActor,
} from "../utils/weaponAttack.mjs";

const { renderTemplate } = foundry.applications.handlebars;
const { Roll } = foundry.dice;
const { mergeObject, deepClone } = foundry.utils;

const rollTemplate = filePath(`templates/chat/roll.hbs`);
const DifficultyLabelKeys = Object.freeze({
	4: `RipCrypt.common.difficulties.easy`,
	5: `RipCrypt.common.difficulties.normal`,
	6: `RipCrypt.common.difficulties.tough`,
	7: `RipCrypt.common.difficulties.hard`,
});

export function getRollSpeaker({ actor, token, alias } = {}) {
	const options = {};
	if (actor) { options.actor = actor };
	if (token) { options.token = token.document ?? token };
	if (alias) { options.alias = alias };

	return Object.keys(options).length
		? ChatMessage.getSpeaker(options)
		: ChatMessage.getSpeaker();
};

export function getRipCryptTarget({ target = 1, edge = 0, drag = 0 } = {}) {
	const baseTarget = Number.isFinite(Number(target)) ? Number(target) : 1;
	const edgeValue = Number.isFinite(Number(edge)) ? Number(edge) : 0;
	const dragValue = Number.isFinite(Number(drag)) ? Number(drag) : 0;

	return Math.max(baseTarget - edgeValue + dragValue, 1);
};

export function buildRipCryptRollFormula({ diceCount = 1, target = 1, edge = 0, drag = 0 } = {}) {
	const dice = Math.max(Number.isFinite(Number(diceCount)) ? Number(diceCount) : 0, 0);
	const effectiveTarget = getRipCryptTarget({ target, edge, drag });
	return `${dice}d8rc${effectiveTarget}`;
};

export async function evaluateRipCryptRoll({ diceCount = 1, target = 1, edge = 0, drag = 0 } = {}) {
	const formula = buildRipCryptRollFormula({ diceCount, target, edge, drag });
	const roll = new Roll(formula);
	await roll.evaluate();

	return {
		roll,
		formula,
		effectiveTarget: getRipCryptTarget({ target, edge, drag }),
	};
};

export async function sendRollToChat(roll, { speaker, flavor, ripcrypt = null } = {}) {
	const messageData = await roll.toMessage({
		speaker: speaker ?? getRollSpeaker(),
		flavor,
	}, { create: false });

	messageData.content = await renderRipCryptRollCard(roll, { flavor, ripcrypt });
	if (ripcrypt) {
		messageData.flags = mergeObject(
			messageData.flags ?? {},
			{
				[game.system.id]: {
					rollCard: deepClone(ripcrypt),
				},
			},
		);
	}
	return ChatMessage.create(messageData);
};

export async function sendWeaponAttackToChat({
	roll,
	actor,
	weapon,
	baseTarget,
	effectiveTarget,
	edgeCount = 0,
	dragCount = 0,
	targetData = null,
	rangeContext = null,
	speaker,
	flavor,
} = {}) {
	const ripcrypt = await buildWeaponAttackChatData({
		actor,
		weapon,
		roll,
		baseTarget,
		effectiveTarget,
		edgeCount,
		dragCount,
		targetData,
		rangeContext,
		deferHeroicSelection: true,
	});

	const message = await sendRollToChat(roll, {
		speaker: speaker ?? getRollSpeaker({ actor }),
		flavor,
		ripcrypt,
	});

	if (ripcrypt.weaponAttack?.pendingHeroicSelection) {
		await resolvePendingWeaponAttackChatData(ripcrypt.weaponAttack);
		await refreshRipCryptMessageCard(message, ripcrypt);
	}

	return message;
};

export function getRipCryptState(roll) {
	for (const die of roll.dice) {
		if (die.ripCryptState === `crypted`) { return `crypted` };
	};

	for (const die of roll.dice) {
		if (die.ripCryptState === `ripping`) { return `ripping` };
	};

	return null;
};

function getRipCryptDifficultySummary(baseTarget) {
	const numericTarget = Number(baseTarget);
	if (!Number.isFinite(numericTarget)) { return null };

	const key = DifficultyLabelKeys[numericTarget];
	if (!key) { return String(numericTarget) };

	const label = game.i18n.localize(key);
	return `${label} (${numericTarget})`;
};

// This is a chat-summary mapping only; the underlying roll total remains the
// actual success count evaluated by Foundry and shown in the expanded details.
function getRipCryptOutcomeLabel(total) {
	const numericTotal = Number(total);
	if (!Number.isFinite(numericTotal)) { return String(total ?? ``) };
	if (numericTotal <= 0) { return game.i18n.localize(`RipCrypt.chat.outcomes.failure`) };
	if (numericTotal === 1) { return game.i18n.localize(`RipCrypt.chat.outcomes.partial`) };
	if (numericTotal === 2) { return game.i18n.localize(`RipCrypt.chat.outcomes.full`) };
	return game.i18n.localize(`RipCrypt.chat.outcomes.heroic`);
};

function getRipCryptDieResultClasses(result) {
	const classes = [];
	if (result.success) { classes.push(`success`) };
	if (result.failure) { classes.push(`failure`) };
	if (result.cryptCheck && !result.crypt) { classes.push(`discarded`) };
	if (result.discarded) { classes.push(`discarded`) };
	return classes.join(` `);
};

function getRipCryptDieResultBadges(_die, result) {
	const badges = [];
	if (result.rip) {
		badges.push(game.i18n.localize(`RipCrypt.chat.badges.rip`));
	};
	if (result.crypt) {
		badges.push(game.i18n.localize(`RipCrypt.chat.badges.crypt`));
	};
	return badges;
};

function getRipCryptRollDetails(roll) {
	const details = [];

	for (const die of roll.dice) {
		const groups = new Map();
		for (const result of die.results ?? []) {
			if (!Number.isFinite(Number(result.result))) { continue };
			const chainIndex = Number.isFinite(Number(result.chainIndex))
				? Number(result.chainIndex)
				: 1;
			const chain = groups.get(chainIndex) ?? [];
			chain.push({
				value: result.result,
				classes: getRipCryptDieResultClasses(result),
				badges: getRipCryptDieResultBadges(die, result),
			});
			groups.set(chainIndex, chain);
		};

		for (const [, results] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
			const [ initial, ...rerolls ] = results;
			if (!initial) { continue };
			details.push({
				label: `d${die.faces}`,
				initial,
				rerolls,
			});
		};
	};

	return details;
};

function getRipCryptDisplayFormula(roll) {
	const formulas = roll.dice
		.map(die => {
			const number = Number(die.number);
			const faces = Number(die.faces);
			if (!Number.isFinite(number) || !Number.isFinite(faces)) { return null };
			return `${number}d${faces}`;
		})
		.filter(Boolean);

	return formulas.join(` + `) || roll.formula;
};

function getWeaponAttackCardContext(attack) {
	if (!attack) { return null };

	const showDamageRows = Boolean(attack.targetName)
		&& (Number(attack.totalSuccesses) > 0)
		&& Boolean(attack.hitLocationLabel);
	const showApplyDamage = showDamageRows
		&& !attack.applied
		&& (Number(attack.appliedDamage) > 0)
		&& Boolean(attack.targetTokenUuid || attack.targetActorUuid);

	return {
		targetTitle: game.i18n.localize(`RipCrypt.chat.labels.target`),
		targetName: attack.targetName ?? null,
		rangeTitle: game.i18n.localize(`RipCrypt.common.range`),
		rangeValue: attack.rangeValue ?? null,
		modifiersTitle: game.i18n.localize(`RipCrypt.chat.labels.modifiers`),
		modifiersValue: attack.modifierSummary ?? null,
		finalModifiersTitle: game.i18n.localize(`RipCrypt.chat.labels.final-modifiers`),
		finalModifiersValue: attack.finalModifierSummary ?? null,
		noTargetMessage: attack.noTargetMessage ?? null,
		pendingHitLocationMessage: attack.pendingHeroicSelection
			? game.i18n.localize(`RipCrypt.chat.weapon.pending-hit-location`)
			: null,
		hitLocationTitle: game.i18n.localize(`RipCrypt.chat.labels.hit-location`),
		hitLocationLabel: attack.hitLocationLabel ?? null,
		hitLocationDetail: attack.hitLocationMethod === `chosen`
			? game.i18n.localize(`RipCrypt.chat.weapon.hit-location-chosen`)
			: (attack.hitLocationRoll
				? game.i18n.format(`RipCrypt.chat.weapon.hit-location-rolled`, {
					formula: attack.hitLocationRoll.formula,
					total: attack.hitLocationRoll.total,
				})
				: null),
		rawDamageTitle: game.i18n.localize(`RipCrypt.chat.labels.damage-before-armour`),
		rawDamageValue: game.i18n.format(`RipCrypt.chat.weapon.raw-damage`, {
			total: attack.rawDamage ?? 0,
			base: attack.baseDamage ?? 0,
			extra: attack.extraSuccesses ?? 0,
		}),
		armourTitle: game.i18n.localize(`RipCrypt.chat.labels.armour-at-location`),
		armourValue: attack.armour ?? 0,
		pendingDamageTitle: game.i18n.localize(`RipCrypt.chat.labels.pending-damage`),
		pendingDamageValue: attack.appliedDamage ?? 0,
		noDamageMessage: attack.noDamageMessage ?? null,
		showDamageRows,
		showApplyDamage,
		applyDamageLabel: game.i18n.format(`RipCrypt.chat.buttons.apply-damage`, {
			value: attack.appliedDamage ?? 0,
		}),
		appliedMessage: attack.applied
			? game.i18n.format(`RipCrypt.chat.weapon.damage-applied`, {
				userName: attack.appliedByName ?? ``,
				targetName: attack.targetName ?? ``,
				value: attack.appliedDamage ?? 0,
				guts: attack.targetGutsAfter ?? `?`,
			})
			: null,
	};
};

function canCurrentUserApplyWeaponDamage(message, targetActor) {
	const canUpdateTarget = targetActor?.canUserModify?.(game.user, `update`) ?? false;
	const canUpdateMessage = message?.canUserModify?.(game.user, `update`) ?? game.user.isGM;
	return canUpdateTarget && canUpdateMessage;
};

async function refreshRipCryptMessageCard(message, ripcrypt) {
	const roll = message.rolls?.[0] ?? null;
	if (!roll) { return };

	const content = await renderRipCryptRollCard(roll, {
		flavor: message.flavor,
		ripcrypt,
	});

	await message.update({
		content,
		[`flags.${game.system.id}.rollCard`]: deepClone(ripcrypt),
	});
};

async function applyWeaponAttackDamage(message, button) {
	const ripcrypt = deepClone(message.getFlag(game.system.id, `rollCard`) ?? {});
	const attack = ripcrypt.weaponAttack;
	if (!attack) { return };
	if (attack.applied) {
		ui.notifications.warn(game.i18n.localize(`RipCrypt.notifs.warn.weapon-attack-damage-already-applied`));
		return;
	};

	const targetActor = await resolveWeaponAttackTargetActor(attack);
	if (!targetActor) {
		ui.notifications.warn(game.i18n.localize(`RipCrypt.notifs.warn.weapon-attack-target-missing`));
		return;
	};

	if (!canCurrentUserApplyWeaponDamage(message, targetActor)) {
		ui.notifications.warn(game.i18n.localize(`RipCrypt.notifs.warn.weapon-attack-cannot-apply-damage`));
		return;
	};

	const currentGuts = Number(targetActor.system.guts?.value ?? 0);
	if (!Number.isFinite(currentGuts)) {
		ui.notifications.warn(game.i18n.localize(`RipCrypt.notifs.warn.weapon-attack-target-missing`));
		return;
	};

	const appliedDamage = Math.max(Number(attack.appliedDamage ?? 0), 0);
	const nextGuts = Math.max(currentGuts - appliedDamage, 0);

	button.disabled = true;
	await targetActor.update({ "system.guts.value": nextGuts });

	attack.applied = true;
	attack.appliedByName = game.user.name;
	attack.targetGutsAfter = nextGuts;
	ripcrypt.weaponAttack = attack;
	await refreshRipCryptMessageCard(message, ripcrypt);
}

export function onRenderRipCryptChatMessage(message, html) {
	const ripcrypt = message.getFlag(game.system.id, `rollCard`) ?? {};
	const attack = ripcrypt.weaponAttack;
	if (!attack) { return };

	const buttons = html.querySelectorAll(`[data-ripcrypt-action="applyWeaponDamage"]`);
	if (buttons.length === 0) { return };

	buttons.forEach(async button => {
		const targetActor = await resolveWeaponAttackTargetActor(attack);
		if (!canCurrentUserApplyWeaponDamage(message, targetActor)) {
			button.disabled = true;
			button.title = game.i18n.localize(`RipCrypt.chat.weapon.apply-damage-disabled`);
			return;
		};

		button.addEventListener(`click`, event => {
			event.preventDefault();
			applyWeaponAttackDamage(message, button).catch(error => {
				console.error(error);
				button.disabled = false;
			});
		});
	});
};

export async function renderRipCryptRollCard(roll, { flavor, ripcrypt = null } = {}) {
	const state = getRipCryptState(roll);
	const difficultySummary = getRipCryptDifficultySummary(ripcrypt?.baseTarget);
	const targetNumber = Number.isFinite(Number(ripcrypt?.effectiveTarget))
		? Number(ripcrypt.effectiveTarget)
		: null;
	const diceDetails = getRipCryptRollDetails(roll);
	const context = {
		flavor,
		formula: getRipCryptDisplayFormula(roll),
		total: ripcrypt?.showOutcomeLabel ? getRipCryptOutcomeLabel(roll.total) : roll.total,
		difficultyLabel: difficultySummary,
		targetLabel: game.i18n.localize(`RipCrypt.chat.labels.target-number`),
		targetNumber,
		difficultyTitle: game.i18n.localize(`RipCrypt.common.difficulty`),
		diceDetails,
		hasDiceDetails: diceDetails.length > 0,
		diceTermLabel: game.i18n.localize(`RipCrypt.chat.labels.dice-term`),
		detailsLabel: game.i18n.localize(`RipCrypt.chat.roll-details`),
		state,
		stateLabel: state ? game.i18n.localize(`RipCrypt.chat.states.${state}`) : null,
		stateClass: state ? `is-${state}` : ``,
		attack: getWeaponAttackCardContext(ripcrypt?.weaponAttack),
	};

	return renderTemplate(rollTemplate, context);
};

export function getHasteDelta(roll) {
	const results = roll.dice[0]?.results ?? [];
	if (!results[0]?.exploded) { return 0 };
	return results[1]?.result === 1 ? -2 : -1;
};

export async function rollHasteCheck({ speaker, flavor } = {}) {
	const roll = new Roll(`1d8xo=1`);
	await roll.evaluate();
	const delta = getHasteDelta(roll);
	const message = await sendRollToChat(roll, { speaker, flavor });

	return {
		roll,
		delta,
		message,
	};
};
