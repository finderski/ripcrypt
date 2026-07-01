import { barAttribute, optionalInteger, requiredInteger } from "../helpers.mjs";
import { CommonItemData } from "./Common.mjs";
import {
	getTraitDisplayData,
	getTraitOptions,
	getUnknownTraitValues,
	RipCryptTraitKinds,
} from "../../config/traits.mjs";
import { gameTerms } from "../../gameTerms.mjs";
import { localizer } from "../../utils/Localizer.mjs";
import { Logger } from "../../utils/Logger.mjs";
import { WeaponAttackAbilities } from "../../utils/weaponAttack.mjs";

const { diffObject, getProperty, setProperty } = foundry.utils;
const { DialogV2 } = foundry.applications.api;
const { fields } = foundry.data;

export class WeaponData extends CommonItemData {
	// #region Schema
	static defineSchema() {
		return {
			...super.defineSchema(),
			traits: new fields.SetField(
				new fields.StringField({
					blank: false,
					trim: true,
					nullable: false,
				}),
				{
					initial: [],
					nullable: false,
					required: true,
				},
			),
			range: new fields.SchemaField({
				short: optionalInteger(),
				long: optionalInteger(),
			}),
			attackAttribute: new fields.StringField({
				initial: gameTerms.Abilities.GRIP,
				blank: false,
				trim: true,
				nullable: false,
				required: true,
				choices: () => WeaponAttackAbilities,
			}),
			damage: requiredInteger({ min: 0, initial: 0 }),
			wear: barAttribute(0, 0, 4),
			equipped: new fields.BooleanField({
				initial: false,
				required: true,
				nullable: false,
			}),
			weight: new fields.StringField({
				blank: false,
				required: true,
				nullable: true,
				initial: null,
				choices: Object.values(gameTerms.WeightRatings),
			}),
		};
	};
	// #endregion Schema

	// #region Lifecycle
	async _preCreate(item, options) {
		const showEquipPrompt = options.showEquipPrompt ?? true;
		if (showEquipPrompt && this.parent.isEmbedded && this._canEquip()) {
			const shouldEquip = await DialogV2.confirm({
				window: { title: localizer(`RipCrypt.Apps.equip-item-title`) },
				content: localizer(`RipCrypt.Apps.equip-item-prompt`, { itemName: item.name }),
			});
			if (shouldEquip) {
				this.updateSource({ "equipped": true });
			};
		};
	};

	/**
	 *
	 * @param {*} changes The expanded object that was used for the update
	 * @param {*} options
	 * @param {*} user
	 * @returns
	 */
	async _preUpdate(changes, options, user) {
		if (options.force && game.settings.get(`ripcrypt`, `devMode`)) { return };

		const diff = diffObject(this.parent._source, changes);
		let valid = await super._preUpdate(changes, options, user);

		if (getProperty(diff, `system.equipped`) && !this._canEquip()) {
			ui.notifications.error(localizer(
				`RipCrypt.notifs.error.cannot-equip`,
				{ itemType: `@TYPES.Item.${this.parent.type}` },
			));

			// Don't stop the update, but don't allow changing the equipped status
			setProperty(changes, `system.equipped`, false);

			// Set a flag so that we can tell the sheet that it needs to rerender
			this.forceRerender = true;
		};
		return valid;
	};
	// #endregion Lifecycle

	// #region Helpers
	/**
	 * Used to tell the preUpdate logic whether or not to prevent the item from
	 * being equipped or not.
	 */
	_canEquip() {
		const parent = this.parent;
		if (!parent.isEmbedded || !(parent.parent instanceof Actor)) {
			Logger.error(`Unable to equip item when it's not embedded`);
			return false;
		};
		const actor = this.parent.parent.system;
		if (actor.equippedWeapons?.length >= actor.limit.weapons) {
			return false;
		};
		return true;
	};

	get traitString() {
		return this.traitDisplayData
			.map(trait => trait.label)
			.join(`, `);
	};

	get traitDisplayData() {
		return getTraitDisplayData(RipCryptTraitKinds.WEAPON, this.traits);
	};

	get rangeString() {
		if (this.range.short && this.range.long) {
			return `${this.range.short} / ${this.range.long}`;
		};
		return String(this.range.short ?? this.range.long ?? ``);
	};
	// #endregion Helpers

	// #region Sheet Data
	async getFormFields(_ctx) {
		const fields = [
			{
				id: `quantity`,
				type: `integer`,
				label: `RipCrypt.common.quantity`,
				path: `system.quantity`,
				value: this.quantity,
				min: 0,
			},
			{
				id: `access`,
				type: `dropdown`,
				label: `RipCrypt.common.access`,
				path: `system.access`,
				value: this.access,
				limited: false,
				options: [
					{
						label: `RipCrypt.common.empty`,
						value: ``,
					},
					...gameTerms.Access.map(opt => ({
						label: `RipCrypt.common.accessLevels.${opt}`,
						value: opt,
					})),
				],
			},
			{
				id: `cost`,
				type: `cost`,
				label: `RipCrypt.common.cost`,
				gold: this.cost.gold,
				silver: this.cost.silver,
				copper: this.cost.copper,
			},
			{
				id: `weight`,
				type: `dropdown`,
				label: `RipCrypt.common.weightRating`,
				path: `system.weight`,
				value: this.weight,
				options: [
					{
						label: `RipCrypt.common.empty`,
						value: ``,
					},
					...Object.values(gameTerms.WeightRatings).map(opt => ({
						label: `RipCrypt.common.weightRatings.${opt}`,
						value: opt,
					})),
				],
			},
			{
				id: `traits`,
				type: `checkbox-set`,
				label: `RipCrypt.common.traits`,
				path: `system.traits`,
				options: getTraitOptions(RipCryptTraitKinds.WEAPON, this.traits),
				unknownValues: getUnknownTraitValues(RipCryptTraitKinds.WEAPON, this.traits),
			},
			{
				id: `attack-attribute`,
				type: `dropdown`,
				label: `RipCrypt.common.attackAttribute`,
				path: `system.attackAttribute`,
				value: this.attackAttribute,
				options: WeaponAttackAbilities.map(ability => ({
					label: `RipCrypt.common.abilities.${ability}`,
					value: ability,
				})),
			},
		];

		// Add the range inputs depending on whether the user wants condensed range
		// or not.
		if (game.settings.get(`ripcrypt`, `condensedRange`)) {
			fields.push({
				type: `bar`,
				label: `RipCrypt.common.range`,
				value: {
					label: `RipCrypt.Apps.short-range`,
					path: `system.range.short`,
					value: this.range.short,
				},
				max: {
					label: `RipCrypt.Apps.long-range`,
					path: `system.range.long`,
					value: this.range.long,
				},
			});
		}
		else {
			fields.push({
				id: `short-range`,
				type: `integer`,
				label: `RipCrypt.Apps.short-range`,
				path: `system.range.short`,
				value: this.range.short ?? ``,
				min: 0,
			},
			{
				id: `long-range`,
				type: `integer`,
				label: `RipCrypt.Apps.long-range`,
				path: `system.range.long`,
				value: this.range.long ?? ``,
				min: 0,
			});
		};

		fields.push(
			{
				id: `damage`,
				type: `integer`,
				label: `RipCrypt.common.damage`,
				path: `system.damage`,
				value: this.damage,
				min: 0,
			},
			{
				type: `bar`,
				label: `RipCrypt.common.wear`,
				value: {
					label: `RipCrypt.Apps.current-wear`,
					path: `system.wear.value`,
					value: this.wear.value,
					min: 0, max: this.wear.max,
				},
				max: {
					label: `RipCrypt.Apps.max-wear`,
					path: `system.wear.max`,
					value: this.wear.max,
					min: 0,
				},
			},
		);

		if (this.parent.isEmbedded) {
			fields.push({
				id: `equipped`,
				type: `boolean`,
				label: `RipCrypt.common.equipped`,
				value: this.equipped,
				path: `system.equipped`,
			});
		};

		return fields;
	};
	// #endregion Sheet Data
};
