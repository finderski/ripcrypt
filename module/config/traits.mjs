import { localizer } from "../utils/Localizer.mjs";

export const RipCryptTraitKinds = Object.freeze({
	GEIST: `geist`,
	WEAPON: `weapon`,
});

// Canonical preset traits sourced from RipCrypt Digital Core Rulebook v1.0:
// weapon traits on p.97 and Geist traits on pp.120-121.
const WeaponTraitPresets = Object.freeze([
	`able`,
	`agile`,
	`ammo`,
	`crude`,
	`heavy`,
	`light`,
	`long`,
	`loud`,
	`modest`,
	`reload`,
	`thrown`,
].map(id => Object.freeze({
	id,
	nameKey: `RipCrypt.traits.weapon.${id}.name`,
	descriptionKey: `RipCrypt.traits.weapon.${id}.description`,
})));

const GeistTraitPresets = Object.freeze([
	`corrosive`,
	`entangle`,
	`fear`,
	`flying`,
	`immunity`,
	`large`,
	`poison`,
	`regeneration`,
	`smog`,
	`stealth`,
	`tough`,
].map(id => Object.freeze({
	id,
	nameKey: `RipCrypt.traits.geist.${id}.name`,
	descriptionKey: `RipCrypt.traits.geist.${id}.description`,
})));

const TraitPresetsByKind = Object.freeze({
	[RipCryptTraitKinds.WEAPON]: WeaponTraitPresets,
	[RipCryptTraitKinds.GEIST]: GeistTraitPresets,
});

function getTraitPresetEntries(kind) {
	return TraitPresetsByKind[kind] ?? [];
};

function traitKey(kind, value) {
	return `${kind}:${value}`;
};

function buildTraitIndex() {
	const index = new Map();

	for (const kind of Object.values(RipCryptTraitKinds)) {
		for (const preset of getTraitPresetEntries(kind)) {
			index.set(traitKey(kind, preset.id), preset);
		};
	};

	return index;
};

const TraitPresetIndex = buildTraitIndex();

function asTraitArray(values) {
	if (values instanceof Set) { return [...values] };
	if (Array.isArray(values)) { return values };
	if (typeof values === `string`) {
		return values
			.split(`,`)
			.map(value => value.trim())
			.filter(Boolean);
	};
	if (values == null) { return [] };
	return [values];
};

function findPresetByRawValue(kind, rawValue) {
	const normalized = String(rawValue ?? ``).trim();
	if (!normalized) { return null };

	const lower = normalized.toLowerCase();
	for (const preset of getTraitPresetEntries(kind)) {
		if (preset.id === lower) { return preset };

		const localizedName = localizer(preset.nameKey).trim().toLowerCase();
		if (localizedName === lower) { return preset };
	};

	return null;
};

export function getTraitPresets(kind) {
	return getTraitPresetEntries(kind);
};

export function normalizeTraitIds(kind, values) {
	const normalized = [];
	const seen = new Set();

	for (const value of asTraitArray(values)) {
		const raw = String(value ?? ``).trim();
		if (!raw) { continue };

		const preset = findPresetByRawValue(kind, raw);
		const key = preset?.id ?? raw;
		if (seen.has(key)) { continue };

		seen.add(key);
		normalized.push(key);
	};

	return normalized;
};

export function getUnknownTraitValues(kind, values) {
	return normalizeTraitIds(kind, values)
		.filter(value => !TraitPresetIndex.has(traitKey(kind, value)));
};

export function getTraitDisplayData(kind, values) {
	return normalizeTraitIds(kind, values)
		.map(value => {
			const preset = TraitPresetIndex.get(traitKey(kind, value));
			if (!preset) {
				return {
					id: value,
					label: value,
					description: null,
					known: false,
				};
			};

			return {
				id: preset.id,
				label: localizer(preset.nameKey),
				description: localizer(preset.descriptionKey),
				known: true,
			};
		});
};

export function getTraitOptions(kind, values) {
	const selected = new Set(normalizeTraitIds(kind, values));

	return getTraitPresetEntries(kind).map(preset => ({
		value: preset.id,
		label: localizer(preset.nameKey),
		description: localizer(preset.descriptionKey),
		checked: selected.has(preset.id),
	}));
};
