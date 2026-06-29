const { fields } = foundry.data;

export function barAttribute(min, initial, max = undefined) {
	return new fields.SchemaField({
		value: new fields.NumberField({
			min,
			initial,
			max,
			integer: true,
			nullable: false,
		}),
		max: new fields.NumberField({
			min,
			initial,
			max,
			integer: true,
			nullable: false,
		}),
	});
};

export function derivedMaximumBar(min, initial) {
	return new fields.SchemaField({
		value: new fields.NumberField({
			min,
			initial,
			integer: true,
			nullable: false,
		}),
		max: new fields.NumberField({
			min,
			initial: min,
			integer: true,
			nullable: false,
			persisted: false,
		}),
	});
};

export function derivedInteger({ min, initial = 0, max } = {}) {
	return new fields.NumberField({
		min,
		initial,
		max,
		required: true,
		nullable: false,
		integer: true,
		persisted: false,
	});
};

export function optionalInteger({min, initial = null, max} = {}) {
	return new fields.NumberField({
		min,
		initial,
		max,
		required: true,
		nullable: true,
		integer: true,
	});
};

export function requiredInteger({ min, initial, max } = {}) {
	if (initial == null || typeof initial !== `number`) {
		throw new Error(`"initial" must be a number`);
	};
	return new fields.NumberField({
		min,
		initial,
		max,
		required: true,
		nullable: false,
		integer: true,
	});
};
