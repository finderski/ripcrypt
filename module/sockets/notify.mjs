import { localizer } from "../utils/Localizer.mjs";

export function notify(payload) {
	// #region Payload Validity
	const {
		message,
		users = [],
		type = `info`,
		permanent = false,
	} = payload;

	if (!message) {
		ui.notifications.error(localizer(
			`RipCrypt.notifs.error.malformed-socket-payload`,
			{
				event: `notify`,
				details: `A message must be provided`,
			},
		));
		return;
	};

	if (users && !Array.isArray(users)) {
		ui.notifications.error(localizer(
			`RipCrypt.notifs.error.malformed-socket-payload`,
			{
				event: `notify`,
				details: `"users" must be an array of user IDs`,
			},
		));
		return;
	};

	if (![`info`, `error`, `success`].includes(type)) {
		ui.notifications.error(localizer(
			`RipCrypt.notifs.error.malformed-socket-payload`,
			{
				event: `notify`,
				details: `An invalid notification type was provided.`,
			},
		));
		return;
	}
	// #endregion Payload Validity

	// Act
	if (users.length === 0 || users.includes(game.user.id)) {
		ui.notifications[type]?.(
			localizer(message),
			{
				console: false,
				permanent,
			},
		);
	};
};
