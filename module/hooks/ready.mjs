import { filePath } from "../consts.mjs";
import { Logger } from "../utils/Logger.mjs";

function ensureDelveDiceHUD() {
	if (ui.delveDice) { return ui.delveDice };
	if (!CONFIG.ui.delveDice) { return null };

	ui.delveDice = new CONFIG.ui.delveDice();
	return ui.delveDice;
};

async function setDefaultTurnMarker() {
	const combatConfig = foundry.utils.deepClone(game.settings.get(`core`, `combatTrackerConfig`) ?? {});
	combatConfig.turnMarker ??= {};
	combatConfig.turnMarker.src = filePath(`assets/turn-marker.png`);
	combatConfig.turnMarker.animation = `spinPulse`;
	await game.settings.set(`core`, `combatTrackerConfig`, combatConfig);
};

Hooks.once(`ready`, async () => {
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

	await ensureDelveDiceHUD()?.render({ force: true });

	// MARK: 1-time updates
	if (!game.settings.get(`ripcrypt`, `firstLoadFinished`)) {
		await setDefaultTurnMarker();
	};

	await game.settings.set(`ripcrypt`, `firstLoadFinished`, true);
});
