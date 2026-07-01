import { gameTerms } from "../gameTerms.mjs";
import { getFateAlignmentEdge } from "./fates.mjs";
import { localizer } from "./Localizer.mjs";
import {
	applyStatusEdgeDrag,
	canActorPerformRipCryptAction,
	RipCryptActionTypes,
} from "./statuses.mjs";

const { DialogV2 } = foundry.applications.api;
const { Roll } = foundry.dice;
const { escapeHTML } = foundry.utils;
const FeetPerRipCryptSpace = 10;

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

export function getTargetedTokenForAttack(_actor) {
	return getSelectedWeaponAttackTarget();
};

function getAttackSourceToken(actor) {
	if (!(actor instanceof Actor) || !canvas?.ready) { return null };
	if (actor.isToken) {
		return actor.token?.object ?? null;
	};

	const controlled = canvas.tokens?.controlled?.find(token => token.actor === actor);
	if (controlled) { return controlled };

	return actor.getActiveTokens(false, false)?.[0] ?? null;
};

function getGridUnits() {
	return String(canvas?.scene?.grid?.units ?? ``).trim().toLowerCase();
};

function formatDistanceInSpaces(distanceInSpaces) {
	if (!Number.isFinite(distanceInSpaces)) { return null };
	return Number.isInteger(distanceInSpaces)
		? String(distanceInSpaces)
		: distanceInSpaces.toFixed(1);
};

function getTokenMeasurementPoint(token) {
	if (!token) { return null };
	const placeable = token.object ?? token;
	const center = placeable?.center;
	if (!center) { return null };
	return {
		x: center.x,
		y: center.y,
		elevation: token.document?.elevation ?? token.elevation ?? 0,
	};
};

export function getTokenDistanceInSpaces(attackerToken, targetToken) {
	if (!canvas?.grid) { return null };

	const origin = getTokenMeasurementPoint(attackerToken);
	const destination = getTokenMeasurementPoint(targetToken);
	if (!origin || !destination) { return null };

	const distance = canvas.grid.measurePath([origin, destination]).distance;
	if (!Number.isFinite(distance)) { return null };

	const units = getGridUnits();
	if (/(^|[^a-z])(ft|feet|foot)([^a-z]|$)/.test(units)) {
		return distance / FeetPerRipCryptSpace;
	};
	if (units.includes(`space`)) {
		return distance;
	};

	const gridDistance = Number(canvas.grid.distance ?? canvas.scene?.grid?.distance);
	if (Number.isFinite(gridDistance) && (gridDistance > 0)) {
		if (gridDistance === 1) { return distance };
		if (gridDistance === FeetPerRipCryptSpace) { return distance / FeetPerRipCryptSpace };
	};

	return distance;
};

function isRangedWeapon(weapon) {
	if (!(weapon instanceof Item) || weapon.type !== `weapon`) { return false };
	const shortRange = Number(weapon.system.range?.short);
	const longRange = Number(weapon.system.range?.long);
	return (Number.isFinite(shortRange) && (shortRange > 0))
		|| (Number.isFinite(longRange) && (longRange > 0));
};

function getWeaponRangeBands(weapon) {
	if (!isRangedWeapon(weapon)) { return null };

	const shortRange = Number(weapon.system.range?.short);
	const longRange = Number(weapon.system.range?.long);
	const midRange = Number.isFinite(shortRange) ? shortRange : (Number.isFinite(longRange) ? longRange : null);
	const maxRange = Number.isFinite(longRange) ? longRange : midRange;
	if (!Number.isFinite(midRange) || !Number.isFinite(maxRange)) { return null };

	return {
		midRange,
		maxRange,
		display: `${midRange} / ${maxRange}`,
	};
};

export function getRangedRangeAdjustment(weapon, distanceInSpaces) {
	const bands = getWeaponRangeBands(weapon);
	if (!bands || !Number.isFinite(distanceInSpaces)) {
		return { drag: 0, blocked: false, detail: null, bands };
	};

	if (distanceInSpaces > bands.maxRange) {
		return {
			drag: 0,
			blocked: true,
			detail: localizer(`RipCrypt.chat.weapon.modifier-out-of-range`),
			bands,
			blockedReason: localizer(`RipCrypt.notifs.warn.weapon-attack-out-of-range`),
		};
	};

	if (distanceInSpaces > bands.midRange) {
		return {
			drag: 1,
			blocked: false,
			detail: localizer(`RipCrypt.chat.weapon.modifier-beyond-mid`),
			bands,
		};
	};

	return {
		drag: 0,
		blocked: false,
		detail: localizer(`RipCrypt.chat.weapon.modifier-within-mid`),
		bands,
	};
};

export function getCloseCombatRangedAdjustment(weapon, distanceInSpaces) {
	if (!isRangedWeapon(weapon) || !Number.isFinite(distanceInSpaces) || (distanceInSpaces > 1)) {
		return { drag: 0, blocked: false, detail: null };
	};

	switch (weapon.system.weight) {
		case gameTerms.WeightRatings.LIGHT:
			return {
				drag: 0,
				blocked: false,
				detail: localizer(`RipCrypt.chat.weapon.modifier-close-light`),
			};
		case gameTerms.WeightRatings.HEAVY:
			return {
				drag: 0,
				blocked: true,
				detail: localizer(`RipCrypt.chat.weapon.modifier-close-heavy`),
				blockedReason: localizer(`RipCrypt.notifs.warn.weapon-attack-heavy-close-combat`),
			};
		case gameTerms.WeightRatings.MODEST:
		default:
			return {
				drag: 1,
				blocked: false,
				detail: localizer(`RipCrypt.chat.weapon.modifier-close-modest`),
			};
	};
};

function formatTnAdjustment(edgeCount, dragCount) {
	const delta = Number(dragCount ?? 0) - Number(edgeCount ?? 0);
	if (delta > 0) { return `+${delta}` };
	if (delta < 0) { return String(delta) };
	return `0`;
};

export function applyRangedWeaponEdgeDrag({
	actor,
	weapon,
	targetData = null,
	rollOptions = {},
} = {}) {
	// RipCrypt ranged rules:
	// - within mid range: no range Drag
	// - beyond mid but within max: +1 Drag
	// - close combat: light none, modest +1 Drag, heavy blocked
	const next = {
		...rollOptions,
		edge: Number.isFinite(Number(rollOptions.edge)) ? Number(rollOptions.edge) : 0,
		drag: Number.isFinite(Number(rollOptions.drag)) ? Number(rollOptions.drag) : 0,
	};
	const rangeContext = {
		isRanged: isRangedWeapon(weapon),
		distanceInSpaces: null,
		rangeDisplay: null,
		modifierDetails: [],
		noTargetWarning: null,
		noSourceWarning: null,
	};
	if (!rangeContext.isRanged) {
		return { ...next, targetData, rangeContext };
	};

	if (!targetData) {
		rangeContext.noTargetWarning = localizer(`RipCrypt.notifs.warn.weapon-attack-range-no-target`);
		rangeContext.modifierDetails.push(localizer(`RipCrypt.chat.weapon.modifier-no-target`));
		return { ...next, targetData, rangeContext };
	};

	const sourceToken = getAttackSourceToken(actor);
	if (!sourceToken) {
		rangeContext.noSourceWarning = localizer(`RipCrypt.notifs.warn.weapon-attack-range-no-source`);
		rangeContext.modifierDetails.push(localizer(`RipCrypt.chat.weapon.modifier-no-source`));
		return { ...next, targetData, rangeContext };
	};

	const distanceInSpaces = getTokenDistanceInSpaces(sourceToken, targetData.token);
	rangeContext.distanceInSpaces = distanceInSpaces;

	const rangeAdjustment = getRangedRangeAdjustment(weapon, distanceInSpaces);
	rangeContext.rangeDisplay = rangeAdjustment.bands?.display ?? null;
	if (rangeAdjustment.detail) {
		rangeContext.modifierDetails.push(rangeAdjustment.detail);
	};
	if (rangeAdjustment.blocked) {
		return {
			...next,
			targetData,
			rangeContext,
			blocked: true,
			blockedReason: rangeAdjustment.blockedReason,
		};
	};
	next.drag += rangeAdjustment.drag;

	const closeCombatAdjustment = getCloseCombatRangedAdjustment(weapon, distanceInSpaces);
	if (closeCombatAdjustment.detail) {
		rangeContext.modifierDetails.push(closeCombatAdjustment.detail);
	};
	if (closeCombatAdjustment.blocked) {
		return {
			...next,
			targetData,
			rangeContext,
			blocked: true,
			blockedReason: closeCombatAdjustment.blockedReason,
		};
	};
	next.drag += closeCombatAdjustment.drag;

	return { ...next, targetData, rangeContext };
};

function getWeaponAttackTargetDifficulty(actor, attackAttribute, targetData = null) {
	const fallback = game.settings.get(`ripcrypt`, `dc`) ?? 1;
	if (!(actor instanceof Actor) || !isWeaponAttackAbility(attackAttribute)) { return fallback };

	const target = targetData ?? getSelectedWeaponAttackTarget();
	const targetActor = target?.actor;
	if (!(targetActor instanceof Actor)) { return fallback };

	const attackerValue = Number(actor.system.ability?.[attackAttribute]);
	const defenderValue = Number(targetActor.system.ability?.[attackAttribute]);
	if (!Number.isFinite(attackerValue) || !Number.isFinite(defenderValue)) { return fallback };

	const delta = attackerValue - defenderValue;
	if (delta > 0) { return 4 };
	if (delta === 0) { return 5 };
	if (delta === -1) { return 6 };
	return 7;
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

async function finalizeWeaponAttackImpact(attack, { promptHeroic = true } = {}) {
	if (!attack?.targetActorUuid && !attack?.targetTokenUuid) { return attack };
	if (Number(attack.totalSuccesses) <= 0) { return attack };
	if (attack.hitLocation) { return attack };

	if ((Number(attack.totalSuccesses) >= 3) && !promptHeroic) {
		attack.pendingHeroicSelection = true;
		return attack;
	};

	const targetActor = await resolveWeaponAttackTargetActor(attack);
	if (!(targetActor instanceof Actor)) {
		attack.noTargetMessage = localizer(`RipCrypt.chat.weapon.no-target`);
		return attack;
	};

	const hitLocation = Number(attack.totalSuccesses) >= 3
		? await chooseHeroicHitLocation({
			actorName: attack.actorName,
			targetName: attack.targetName,
			weaponName: attack.weaponName,
		})
		: await rollWeaponHitLocation();

	delete attack.pendingHeroicSelection;
	attack.hitLocation = hitLocation.location;
	attack.hitLocationLabel = getWeaponHitLocationName(hitLocation.location);
	attack.hitLocationMethod = hitLocation.method;
	attack.hitLocationRoll = hitLocation.roll;

	const armour = Number(targetActor.system.defense?.[hitLocation.location] ?? 0);
	attack.armour = Number.isFinite(armour) ? armour : 0;
	attack.appliedDamage = Math.max(Number(attack.rawDamage ?? 0) - attack.armour, 0);

	if (attack.appliedDamage <= 0) {
		attack.noDamageMessage = localizer(`RipCrypt.chat.weapon.no-damage-penetrates`, {
			targetName: attack.targetName,
			locationName: attack.hitLocationLabel,
		});
	};

	return attack;
};

export async function buildWeaponAttackChatData({
	actor,
	weapon,
	roll,
	baseTarget,
	effectiveTarget,
	edgeCount = 0,
	dragCount = 0,
	targetData = null,
	rangeContext = null,
	deferHeroicSelection = false,
} = {}) {
	const totalSuccesses = Math.max(Number(roll?.total ?? 0), 0);
	const baseDamage = Math.max(Number(weapon?.system?.damage ?? 0), 0);
	const extraSuccesses = Math.max(totalSuccesses - 1, 0);
	const rawDamage = baseDamage + extraSuccesses;

	const attack = {
		actorName: actor?.name ?? ``,
		weaponName: weapon?.name ?? ``,
		abilityName: getWeaponAttackAbilityName(weapon?.system?.attackAttribute),
		edgeCount,
		dragCount,
		finalModifierSummary: (rangeContext?.isRanged || edgeCount || dragCount)
			? localizer(`RipCrypt.chat.weapon.final-modifiers`, {
				edge: edgeCount,
				drag: dragCount,
				adjustment: formatTnAdjustment(edgeCount, dragCount),
			})
			: null,
		totalSuccesses,
		baseDamage,
		extraSuccesses,
		rawDamage,
		appliedDamage: 0,
		armour: 0,
		applied: false,
	};

	const target = targetData ?? getSelectedWeaponAttackTarget();
	const distanceText = formatDistanceInSpaces(rangeContext?.distanceInSpaces);
	if (distanceText) {
		attack.rangeValue = localizer(`RipCrypt.chat.weapon.range-detail`, {
			distance: distanceText,
			range: rangeContext?.rangeDisplay ?? `-`,
		});
	};
	if (rangeContext?.modifierDetails?.length) {
		attack.modifierSummary = rangeContext.modifierDetails.join(`; `);
	};
	if (!target) {
		attack.noTargetMessage = rangeContext?.noTargetWarning
			? localizer(`RipCrypt.chat.weapon.no-target-range`)
			: localizer(`RipCrypt.chat.weapon.no-target`);
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
	if (rangeContext?.noSourceWarning && !attack.modifierSummary) {
		attack.modifierSummary = localizer(`RipCrypt.chat.weapon.modifier-no-source`);
	};

	await finalizeWeaponAttackImpact(attack, {
		promptHeroic: !(deferHeroicSelection && (totalSuccesses >= 3)),
	});

	return {
		baseTarget,
		effectiveTarget,
		showOutcomeLabel: true,
		weaponAttack: attack,
	};
};

export async function resolvePendingWeaponAttackChatData(attack = {}) {
	return finalizeWeaponAttackImpact(attack, { promptHeroic: true });
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
	if (!canActorPerformRipCryptAction(actor, { actionType: RipCryptActionTypes.ATTACK })) {
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
	const rollOptions = applyStatusEdgeDrag(actor, {
		edge: getFateAlignmentEdge(actor),
		drag: 0,
	});
	const targetData = getTargetedTokenForAttack(actor);
	const rangedAttack = applyRangedWeaponEdgeDrag({
		actor,
		weapon,
		targetData,
		rollOptions,
	});
	if (rangedAttack.rangeContext?.noTargetWarning) {
		ui.notifications.warn(rangedAttack.rangeContext.noTargetWarning);
	};
	if (rangedAttack.rangeContext?.noSourceWarning) {
		ui.notifications.warn(rangedAttack.rangeContext.noSourceWarning);
	};
	if (rangedAttack.blocked) {
		ui.notifications.warn(rangedAttack.blockedReason);
		return null;
	};

	return {
		actor,
		weapon,
		attackAttribute,
		abilityName,
		diceCount,
		targetData,
		rangeContext: rangedAttack.rangeContext,
		edge: rangedAttack.edge,
		drag: rangedAttack.drag,
		target: getWeaponAttackTargetDifficulty(actor, attackAttribute, targetData),
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
