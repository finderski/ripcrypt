import { CommonItemData } from "./Common.mjs";
import { gameTerms } from "../../gameTerms.mjs";
import { localizer } from "../../utils/Localizer.mjs";
import { Logger } from "../../utils/Logger.mjs";
import { requiredInteger } from "../helpers.mjs";

const { diffObject, getProperty, setProperty } = foundry.utils;
const { DialogV2 } = foundry.applications.api;
const { fields } = foundry.data;

/** Used for Armour and Shields */
export class ArmourData extends CommonItemData {
	// #region Schema
	static defineSchema() {
		return {
			...super.defineSchema(),
			protection: requiredInteger({ min: 0, initial: 1 }),
			location: new fields.SetField(
				new fields.StringField({
					blank: false,
					trim: true,
					nullable: false,
					required: true,
					choices: Object.values(gameTerms.Anatomy),
				}),
				{
					required: true,
					nullable: false,
					initial: [],
				},
			),
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

	async _preUpdate(changes, options, user) {
		if (options.force && game.settings.get(`ripcrypt`, `devMode`)) { return };

		// Ensure changes is a diffed object
		const diff = diffObject(this.parent._source, changes);
		let valid = await super._preUpdate(changes, options, user);

		if (getProperty(diff, `system.equipped`) && !this._canEquip()) {
			ui.notifications.error(
				localizer(
					`RipCrypt.notifs.error.cannot-equip`,
					{ itemType: `@TYPES.Item.${this.parent.type}` },
				),
				{ console: false },
			);

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

		if (this.location.size === 0) {
			Logger.error(`Unable to equip an item without any locations`);
			return false;
		};

		const actor = parent.parent;
		const desiredLocations = new Set(
			[...this.location]
				.map(location => String(location).toLowerCase())
				.filter(Boolean),
		);

		for (const armour of actor.itemTypes.armour) {
			if (armour.id === parent.id || !armour.system.equipped) { continue };

			const overlappingLocations = [...armour.system.location]
				.map(location => String(location).toLowerCase())
				.filter(location => desiredLocations.has(location));
			if (overlappingLocations.length === 0) { continue };

			Logger.error(
				`Unable to equip multiple items in the same slot`,
				{
					item: parent.name,
					conflictingItem: armour.name,
					locations: overlappingLocations,
				},
			);
			return false;
		}
		return true;
	};

	get locationString() {
		return [...this.location].join(`, `);
	};
	// #endregion Helpers
};
