import { filePath } from "../../consts.mjs";
import { gameTerms } from "../../gameTerms.mjs";
import { GenericAppMixin } from "../GenericApp.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { getProperty, hasProperty, setProperty } = foundry.utils;

export class ArmourSheet extends GenericAppMixin(HandlebarsApplicationMixin(ItemSheetV2)) {

	// #region Options
	static DEFAULT_OPTIONS = {
		classes: [
			`ripcrypt--item`,
			`ArmourSheet`,
		],
		position: {
			width: `auto`,
			height: `auto`,
		},
		window: {
			resizable: false,
		},
		form: {
			submitOnChange: true,
			closeOnSubmit: false,
		},
	};

	static PARTS = {
		header: {
			template: filePath(`templates/Apps/partials/item-header.hbs`),
		},
		content: {
			template: filePath(`templates/Apps/ArmourSheet/content.hbs`),
		},
	};
	// #endregion

	// #region Lifecycle
	async _onRender(context, options) {
		await super._onRender(context, options);

		// remove the flag if it exists when we render the sheet
		delete this.document?.system?.forceRerender;
	};

	/**
	 * Used to make it so that items that don't get updated because of the
	 * _preUpdate hook removing/changing the data submitted, can still get
	 * re-rendered when the diff is empty. If the document does get updated,
	 * this rerendering does not happen.
	 *
	 * @override
	 */
	async _processSubmitData(...args) {
		await super._processSubmitData(...args);

		if (this.document.system.forceRerender) {
			await this.render();
		};
	};

	/**
	 * Customize how form data is extracted into an expanded object.
	 * @param {SubmitEvent|null} event The originating form submission event
	 * @param {HTMLFormElement} form The form element that was submitted
	 * @param {FormDataExtended} formData Processed data for the submitted form
	 * @returns {object} An expanded object of processed form data
	 * @throws {Error} Subclasses may throw validation errors here to prevent form submission
	 * @protected
	 */
	_processFormData(event, form, formData) {
		const data = super._processFormData(event, form, formData);

		if (hasProperty(data, `system.weight`)) {
			const weight = getProperty(data, `system.weight`);
			if (weight === `` || weight === `null`) {
				setProperty(data, `system.weight`, null);
			};
		};

		if (hasProperty(data, `system.location`)) {
			let locations = getProperty(data, `system.location`);
			if (!Array.isArray(locations)) {
				locations = locations == null ? [] : [locations];
			};
			locations = locations.filter(value => value != null && value !== ``);
			setProperty(data, `system.location`, locations);
		};

		return data;
	};
	// #endregion

	// #region Data Prep
	async _preparePartContext(partId, ctx, opts) {
		ctx = await super._preparePartContext(partId, ctx, opts);

		ctx.item = this.document;
		ctx.system = this.document.system;

		switch (partId) {
			case `content`: {
				this._prepareContentContext(ctx, opts);
				break;
			};
		};

		return ctx;
	};

	async _prepareContentContext(ctx) {
		ctx.weights = [
			{
				label: `RipCrypt.common.empty`,
				value: ``,
			},
			...Object.values(gameTerms.WeightRatings).map(opt => ({
				label: `RipCrypt.common.weightRatings.${opt}`,
				value: opt,
			})),
		];

		ctx.accesses = [
			{
				label: `RipCrypt.common.empty`,
				value: ``,
			},
			...gameTerms.Access.map(opt => ({
				label: `RipCrypt.common.accessLevels.${opt}`,
				value: opt,
			})),
		];

		ctx.protects = {
			head: this.document.system.location.has(gameTerms.Anatomy.HEAD),
			body: this.document.system.location.has(gameTerms.Anatomy.BODY),
			arms: this.document.system.location.has(gameTerms.Anatomy.ARMS),
			legs: this.document.system.location.has(gameTerms.Anatomy.LEGS),
		};
	};
	// #endregion

	// #region Actions
	// #endregion
};
