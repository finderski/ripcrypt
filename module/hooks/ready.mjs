import { filePath } from "../consts.mjs";
import { Logger } from "../utils/Logger.mjs";

Hooks.once(`ready`, () => {
	Logger.log(`Ready`);

	let defaultTab = game.settings.get(`ripcrypt`, `defaultTab`);
	if (defaultTab) {
		try {
			Logger.debug(`Switching sidebar tab to:`, defaultTab);
			ui.sidebar.changeTab(defaultTab, `primary`);
		}
		catch {
			Logger.error(`Failed to change to sidebar tab:`, defaultTab);
		};
	};

	if (game.settings.get(`ripcrypt`, `devMode`)) {
		ui.sidebar.expand();
		if (game.paused) { game.togglePause(false, { broadcast: true }) };
	};

	ui.delveDice.render({ force: true });

	// MARK: 1-time updates
	if (!game.settings.get(`ripcrypt`, `firstLoadFinished`)) {
		// Update the turnMarker to be the RipCrypt defaults
		const combatConfig = game.settings.get(`core`, `combatTrackerConfig`);
		combatConfig.turnMarker.src = filePath(`assets/turn-marker.png`);
		combatConfig.turnMarker.animation = `spinPulse`;
		game.settings.set(`core`, `combatTrackerConfig`, combatConfig);
	};

	game.settings.set(`ripcrypt`, `firstLoadFinished`, true);
});
