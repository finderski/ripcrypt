import { localizer } from "../../utils/Localizer.mjs";

const { escapeExpression } = Handlebars;

function renderReadonlyEntries(entries) {
	if (entries.length === 0) {
		return `<div class="value">---</div>`;
	};

	return entries.map(entry => {
		const label = escapeExpression(entry.label);
		const description = entry.description ? escapeExpression(entry.description) : ``;
		if (!description) {
			return `<div class="tag">${label}</div>`;
		};

		return `<details class="ripcrypt-trait-entry">
			<summary>${label}</summary>
			<p>${description}</p>
		</details>`;
	}).join(``);
};

export function checkboxSet(input, data) {
	const label = localizer(input.label);
	const id = `${data.meta.idp}-${input.id}`;
	const options = Array.isArray(input.options) ? input.options : [];
	const unknownValues = Array.isArray(input.unknownValues) ? input.unknownValues : [];

	if (data.meta.limited && input.limited) {
		return `<div data-input-type="checkbox-set">
			<span class="label">${label}</span>
			<div class="value">???</div>
		</div>`;
	};

	if (!data.meta.editable) {
		const entries = [
			...options
				.filter(option => option.checked)
				.map(option => ({
					label: option.label,
					description: option.description,
				})),
			...unknownValues.map(value => ({
				label: value,
				description: null,
			})),
		];

		return `<div data-input-type="checkbox-set">
			<span class="label">${label}</span>
			<div class="ripcrypt-checkbox-set-readonly">
				${renderReadonlyEntries(entries)}
			</div>
		</div>`;
	};

	const hiddenUnknownValues = unknownValues
		.map(value => `<input
			type="hidden"
			name="${escapeExpression(input.path)}"
			value="${escapeExpression(value)}"
		>`)
		.join(``);

	const renderedOptions = options.map((option, index) => {
		const optionId = `${id}-${index}`;
		return `<label class="ripcrypt-checkbox-set-option" for="${optionId}">
			<input
				type="checkbox"
				id="${optionId}"
				name="${escapeExpression(input.path)}"
				value="${escapeExpression(option.value)}"
				${option.checked ? `checked` : ``}
			>
			<span class="ripcrypt-checkbox-set-option-label">${escapeExpression(option.label)}</span>
			${option.description
				? `<small class="ripcrypt-checkbox-set-option-description">${escapeExpression(option.description)}</small>`
				: ``}
		</label>`;
	}).join(``);

	return `<div data-input-type="checkbox-set">
		<span class="label">${label}</span>
		<div class="ripcrypt-checkbox-set-options">
			<input
				type="hidden"
				name="__setMarkers.${escapeExpression(input.path)}"
				value="1"
			>
			${hiddenUnknownValues}
			${renderedOptions}
		</div>
	</div>`;
};
