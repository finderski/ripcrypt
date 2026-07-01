import { filePath, toBoolean } from "../consts.mjs";
import { localizer } from "./Localizer.mjs";

const { deepClone, getProperty } = foundry.utils;
const STATUS_CHANGE_MODE = `override`;

export const RipCryptStatusIds = Object.freeze({
	FAZED: `fazed`,
	FATIGUED: `fatigued`,
	FEARFUL: `fearful`,
	FRENZIED: `frenzied`,
});

export const RipCryptActionTypes = Object.freeze({
	UNTYPED: `untyped`,
	ATTACK: `attack`,
	MOVE: `move`,
	BREAK: `break`,
	FLEE: `flee`,
});

const FearfulAllowedActionTypes = new Set([
	RipCryptActionTypes.MOVE,
	RipCryptActionTypes.BREAK,
	RipCryptActionTypes.FLEE,
]);

const StatusFlagPaths = Object.freeze({
	[RipCryptStatusIds.FAZED]: `flags.ripcrypt.noActions`,
	[RipCryptStatusIds.FATIGUED]: `flags.ripcrypt.allActionsDrag`,
	[RipCryptStatusIds.FEARFUL]: `flags.ripcrypt.restrictedToFleeing`,
	[RipCryptStatusIds.FRENZIED]: `flags.ripcrypt.allActionsEdge`,
});

// Placeholder system-owned morale icons. Replace these SVGs with final art when
// RipCrypt-specific condition assets are available.
const StatusEffects = Object.freeze([
	{
		id: RipCryptStatusIds.FAZED,
		name: `RipCrypt.statuses.fazed`,
		img: filePath(`assets/icons/statuses/fazed.svg`),
		order: 10,
		statuses: [RipCryptStatusIds.FAZED],
		changes: [
			{
				key: StatusFlagPaths[RipCryptStatusIds.FAZED],
				mode: STATUS_CHANGE_MODE,
				value: `true`,
			},
		],
	},
	{
		id: RipCryptStatusIds.FATIGUED,
		name: `RipCrypt.statuses.fatigued`,
		img: filePath(`assets/icons/statuses/fatigued.svg`),
		order: 20,
		statuses: [RipCryptStatusIds.FATIGUED],
		changes: [
			{
				key: StatusFlagPaths[RipCryptStatusIds.FATIGUED],
				mode: STATUS_CHANGE_MODE,
				value: `true`,
			},
		],
	},
	{
		id: RipCryptStatusIds.FEARFUL,
		name: `RipCrypt.statuses.fearful`,
		img: filePath(`assets/icons/statuses/fearful.svg`),
		order: 30,
		statuses: [RipCryptStatusIds.FEARFUL],
		changes: [
			{
				key: StatusFlagPaths[RipCryptStatusIds.FEARFUL],
				mode: STATUS_CHANGE_MODE,
				value: `true`,
			},
		],
	},
	{
		id: RipCryptStatusIds.FRENZIED,
		name: `RipCrypt.statuses.frenzied`,
		img: filePath(`assets/icons/statuses/frenzied.svg`),
		order: 40,
		statuses: [RipCryptStatusIds.FRENZIED],
		changes: [
			{
				key: StatusFlagPaths[RipCryptStatusIds.FRENZIED],
				mode: STATUS_CHANGE_MODE,
				value: `true`,
			},
		],
	},
]);

function getStatusFlagValue(actor, statusId) {
	const path = StatusFlagPaths[statusId];
	if (!path || !(actor instanceof Actor)) { return false };
	return toBoolean(getProperty(actor, path));
};

export function registerRipCryptStatusEffects() {
	CONFIG.statusEffects = StatusEffects.map(effect => deepClone(effect));
};

export function hasRipCryptStatus(actor, statusId) {
	if (!(actor instanceof Actor) || !statusId) { return false };
	if (actor.statuses?.has(statusId)) { return true };
	return getStatusFlagValue(actor, statusId);
};

export function getRipCryptStatusFlags(actor) {
	return {
		noActions: hasRipCryptStatus(actor, RipCryptStatusIds.FAZED),
		allActionsDrag: hasRipCryptStatus(actor, RipCryptStatusIds.FATIGUED),
		restrictedToFleeing: hasRipCryptStatus(actor, RipCryptStatusIds.FEARFUL),
		allActionsEdge: hasRipCryptStatus(actor, RipCryptStatusIds.FRENZIED),
	};
};

export function applyStatusEdgeDrag(actor, rollOptions = {}) {
	const next = {
		...rollOptions,
		edge: Number.isFinite(Number(rollOptions.edge)) ? Number(rollOptions.edge) : 0,
		drag: Number.isFinite(Number(rollOptions.drag)) ? Number(rollOptions.drag) : 0,
	};

	const statusFlags = getRipCryptStatusFlags(actor);
	if (statusFlags.allActionsEdge) {
		next.edge += 1;
	};
	if (statusFlags.allActionsDrag) {
		next.drag += 1;
	};

	return next;
};

export function canActorPerformRipCryptAction(
	actor,
	{ actionType = RipCryptActionTypes.UNTYPED, warn = true } = {},
) {
	if (!(actor instanceof Actor)) { return true };

	const statusFlags = getRipCryptStatusFlags(actor);
	if (statusFlags.noActions) {
		if (warn) {
			ui.notifications.warn(localizer(`RipCrypt.notifs.warn.fazed-no-actions`));
		};
		return false;
	};

	// TODO: Un-typed trait checks cannot yet distinguish break/move/flee from other
	// actions. Enforce Fearful immediately for typed actions, and revisit generic
	// checks once action metadata exists on the roll launchers.
	if (statusFlags.restrictedToFleeing && (actionType !== RipCryptActionTypes.UNTYPED)
		&& !FearfulAllowedActionTypes.has(actionType)) {
		if (warn) {
			ui.notifications.warn(localizer(`RipCrypt.notifs.warn.fearful-restricted-actions`));
		};
		return false;
	};

	return true;
};
