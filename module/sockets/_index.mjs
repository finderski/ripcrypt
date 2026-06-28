import { localizer } from "../utils/Localizer.mjs";
import { Logger } from "../utils/Logger.mjs";
import { notify } from "./notify.mjs";
import { updateSands } from "./updateSands.mjs";

const events = {
	notify,
	updateSands,
};

export function registerSockets() {
	Logger.info(`Setting up socket listener`);

	game.socket.on(`system.ripcrypt`, (data, userID) => {
		const { event, payload } = data ?? {};
		if (event == null || payload === undefined) {
			ui.notifications.error(localizer(`RipCrypt.notifs.error.invalid-socket`));
			return;
		};

		if (events[event] == null) {
			ui.notifications.error(localizer(`RipCrypt.notifs.error.unknown-socket-event`, { event }));
			return;
		};

		const user = game.users.get(userID);
		events[event](payload, user);
	});
};
