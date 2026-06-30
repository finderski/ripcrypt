const { Die } = foundry.dice.terms;

export class CryptDie extends Die {
	static get MODIFIERS() {
		return {
			...super.MODIFIERS,
			"rc": `ripOrCrypt`,
		};
	};

	ripCryptState = undefined;
	ripCryptTarget = undefined;

	async ripOrCrypt(modifier) {
		const rgx = /rc([0-9]+)/i;
		const match = modifier.match(rgx);
		if (!match) { return false };
		const [ target ] = match.slice(1);
		const targetValue = Number(target);
		if (!Number.isFinite(targetValue)) { return false };

		this.ripCryptTarget = targetValue;
		this.ripCryptState = undefined;

		const initialCount = Number(this.number ?? this.results.length);
		const initialResults = this.results.slice(0, initialCount);

		for (const result of this.results) {
			delete result.success;
			delete result.failure;
			delete result.rip;
			delete result.crypt;
			delete result.cryptCheck;
		};

		for (const [index, result] of initialResults.entries()) {
			const chainIndex = index + 1;
			result.chainIndex = chainIndex;

			if (result.result === this.faces) {
				await this.#resolveRip(result, targetValue, chainIndex);
				continue;
			};

			if (result.result === 1) {
				await this.#resolveCrypt(result, chainIndex);
				continue;
			};

			if (result.result >= targetValue) {
				result.success = true;
			};
		};
	};

	get total() {
		if (this.ripCryptTarget == null) {
			return Math.max(super.total, 0);
		};

		let total = 0;
		for (const result of this.results) {
			if (result.success) { total += 1 };
			if (result.failure) { total -= 1 };
		};
		return Math.max(total, 0);
	};

	async #resolveRip(result, targetValue, chainIndex) {
		result.success = true;
		result.exploded = true;
		result.rip = true;
		if (this.ripCryptState !== `crypted`) {
			this.ripCryptState = `ripping`;
		};

		while (true) {
			const reroll = await this.roll();
			reroll.chainIndex = chainIndex;
			if (reroll.result === this.faces) {
				reroll.success = true;
				reroll.exploded = true;
				reroll.rip = true;
				continue;
			};

			if (reroll.result >= targetValue) {
				reroll.success = true;
			};
			break;
		};
	};

	async #resolveCrypt(result, chainIndex) {
		result.failure = true;

		const reroll = await this.roll();
		reroll.chainIndex = chainIndex;
		reroll.cryptCheck = true;
		if (reroll.result === 1) {
			reroll.crypt = true;
			this.ripCryptState = `crypted`;
		};
	};
};
