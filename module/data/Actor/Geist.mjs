import { getTraitDisplayData, RipCryptTraitKinds } from "../../config/traits.mjs";
import { EntityData } from "./Entity.mjs";

const { fields } = foundry.data;

export class GeistData extends EntityData {
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
		};
	};

	get traitDisplayData() {
		return getTraitDisplayData(RipCryptTraitKinds.GEIST, this.traits);
	};

	get traitString() {
		return this.traitDisplayData.map(trait => trait.label).join(`, `);
	};
};
