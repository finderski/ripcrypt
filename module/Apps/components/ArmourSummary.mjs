import { filePath } from "../../consts.mjs";
import { StyledShadowElement } from "./mixins/StyledShadowElement.mjs";

const { renderTemplate } = foundry.applications.handlebars;

export class ArmourSummary extends StyledShadowElement(HTMLElement) {
	static elementName = `armour-summary`;
	static formAssociated = false;

	/* Stuff for the mixin to use */
	static _stylePath = `css/components/armour-summary.css`;
	#container;

	get type() {
		return this.getAttribute(`type`) ?? `hero`;
	};

	set type(newValue) {
		this.setAttribute(`type`, newValue);
	};

	_mounted = false;
	async connectedCallback() {
		super.connectedCallback();
		if (this._mounted) { return };

		/*
		This converts all of the double-dash prefixed properties on the element to
		CSS variables so that they don't all need to be provided by doing style=""
		*/
		for (const attrVar of this.attributes) {
			if (attrVar.name?.startsWith(`var:`)) {
				const prop = attrVar.name.replace(`var:`, ``);
				this.style.setProperty(`--` + prop, attrVar.value);
			};
		};

		this.#container = document.createElement(`div`);
		this.#container.classList = `person`;

		this.#container.innerHTML = await renderTemplate(
			filePath(`templates/components/armour-summary.hbs`),
			{ type: this.type },
		);

		this._shadow.appendChild(this.#container);

		this._mounted = true;
	};

	disconnectedCallback() {
		super.disconnectedCallback();
		if (!this._mounted) { return };
		this._mounted = false;
	};
};
