import { filePath } from "../../consts.mjs";
import { GenericAppMixin } from "../GenericApp.mjs";
import { Logger } from "../../utils/Logger.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { getProperty, hasProperty, setProperty } = foundry.utils;

export class AllItemSheetV1 extends GenericAppMixin(HandlebarsApplicationMixin(ItemSheetV2)) {

	// #region Options
	static DEFAULT_OPTIONS = {
		classes: [
			`ripcrypt--item`,
			`ripcrypt--AllItemSheetV1`,
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
		content: {
			template: filePath(`templates/Apps/AllItemSheetV1/content.hbs`),
		},
	};
	// #endregion

	// #region Lifecycle
	async _preparePartContext(partId, ctx, opts) {
		ctx = await super._preparePartContext(partId, ctx, opts);
		ctx.item = this.document;

		ctx.formFields = await this.document.system.getFormFields(ctx);

		Logger.debug(`Context:`, ctx);
		return ctx;
	};

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

	_processFormData(event, form, formData) {
		const data = super._processFormData(event, form, formData);

		if (hasProperty(data, `system.weight`)) {
			const weight = getProperty(data, `system.weight`);
			if (weight === `` || weight === `null`) {
				setProperty(data, `system.weight`, null);
			};
		};

		return data;
	};
	// #endregion

	// #region Actions
	// #endregion
};
