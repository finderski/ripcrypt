import { clamp } from "../utils/clamp.mjs";
import { localizer } from "../utils/Localizer.mjs";

export function updateSands(payload) {
	if (!game.user.isActiveGM) { return };
	if (!game.settings.get(game.system.id, `allowUpdateSandsSocket`)) { return };

	// Assert payload validity
	const { value, delta } = payload;
	if (value == null && delta == null) {
		ui.notifications.error(localizer(
			`RipCrypt.notifs.error.malformed-socket-payload`,
			{
				event: `updateSands`,
				details: `Either value or delta must be provided`,
			},
		));
		return;
	};

	// Take action
	if (value != null) {
		const initial = game.settings.get(game.system.id, `sandsOfFateInitial`);
		let sands = clamp(0, value, initial);
		if (sands === 0) {
			ui.delveDice.alertCrypticEvent();
			sands = initial;
		};
		game.settings.set(
			game.system.id,
			`sandsOfFate`,
			sands,
		);
	}
	else if (delta != null) {
		ui.delveDice.sandsOfFateDelta(delta);
	};
};
