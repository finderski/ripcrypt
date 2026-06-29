import { localizer } from "../../utils/Localizer.mjs";
import { options } from "../options.mjs";

export function dropdownInput(input, data) {
	const label = localizer(input.label);
	const id = `${data.meta.idp}-${input.id}`;
	const value = input.value ?? ``;

	if (!data.meta.editable) {
		return `<div data-input-type="dropdown">
			<span class="label">${label}</span>
			<span class="value">${data.meta.limited && input.limited ? `???` : value}</span>
		</div>`;
	};

	if (!input.options.length) {
		throw new Error(`dropdown type inputs must have some options`);
	};

	return `<div data-input-type="dropdown">
		<label
			for="${id}"
		>
			${label}
		</label>
		<select
			id="${id}"
			name="${input.path}"
		>
			${options(
				value,
				input.options,
				{ hash: { localize: true }},
			)}
		</select>
	</div>`;
};
