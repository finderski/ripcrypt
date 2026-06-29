import { filePath } from "../consts.mjs";

const { Roll } = foundry.dice;

const rollTemplate = filePath(`templates/chat/roll.hbs`);

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

export async function sendRollToChat(roll, { speaker, flavor } = {}) {
	const messageData = await roll.toMessage({
		speaker: speaker ?? getRollSpeaker(),
		flavor,
	}, { create: false });

	messageData.content = await renderRipCryptRollCard(roll, { flavor });
	return ChatMessage.create(messageData);
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

export async function renderRipCryptRollCard(roll, { flavor } = {}) {
	const state = getRipCryptState(roll);
	const context = {
		flavor,
		formula: roll.formula,
		total: roll.total,
		tooltip: await roll.getTooltip(),
		state,
		stateLabel: state ? game.i18n.localize(`RipCrypt.chat.states.${state}`) : null,
		stateClass: state ? `is-${state}` : ``,
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
