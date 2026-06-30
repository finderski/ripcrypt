// Applications
import { AllItemSheetV1 } from "../Apps/ItemSheets/AllItemSheetV1.mjs";
import { ArmourSheet } from "../Apps/ItemSheets/ArmourSheet.mjs";
import { CombinedHeroSheet } from "../Apps/ActorSheets/CombinedHeroSheet.mjs";
import { CraftCardV1 } from "../Apps/ActorSheets/CraftCardV1.mjs";
import { DelveDiceHUD } from "../Apps/DelveDiceHUD.mjs";
import { RipCryptCombatTracker } from "../Apps/sidebar/CombatTracker.mjs";
import { SkillsCardV1 } from "../Apps/ActorSheets/SkillsCardV1.mjs";
import { StatsCardV1 } from "../Apps/ActorSheets/StatsCardV1.mjs";

// Data Models
import { AmmoData } from "../data/Item/Ammo.mjs";
import { ArmourData } from "../data/Item/Armour.mjs";
import { CraftData } from "../data/Item/Craft.mjs";
import { GeistData } from "../data/Actor/Geist.mjs";
import { GoodData } from "../data/Item/Good.mjs";
import { HeroData } from "../data/Actor/Hero.mjs";
import { ShieldData } from "../data/Item/Shield.mjs";
import { SkillData } from "../data/Item/Skill.mjs";
import { WeaponData } from "../data/Item/Weapon.mjs";

// Class Overrides
import { CryptDie } from "../dice/CryptDie.mjs";

// Documents
import { RipCryptActor } from "../documents/actor.mjs";
import { RipCryptCombat } from "../documents/combat.mjs";
import { RipCryptCombatant } from "../documents/combatant.mjs";
import { RipCryptItem } from "../documents/item.mjs";
import { RipCryptToken } from "../documents/token.mjs";

// Misc
import { filePath } from "../consts.mjs";
import helpers from "../handlebarHelpers/_index.mjs";
import { Logger } from "../utils/Logger.mjs";
import { registerCustomComponents } from "../Apps/components/_index.mjs";
import { onRenderRipCryptChatMessage } from "../rolls/ripcrypt-rolls.mjs";
import { registerDevSettings } from "../settings/devSettings.mjs";
import { registerMetaSettings } from "../settings/metaSettings.mjs";
import { registerSockets } from "../sockets/_index.mjs";
import { registerUserSettings } from "../settings/userSettings.mjs";
import { registerWorldSettings } from "../settings/worldSettings.mjs";

const { Items, Actors } = foundry.documents.collections;

const preloadedTemplates = [
	`templates/Apps/AllItemSheetV1/content.hbs`,
	`templates/Apps/ArmourSheet/content.hbs`,
	`templates/Apps/CombinedHeroSheet/crafts.hbs`,
	`templates/Apps/CraftCardV1/content.hbs`,
	`templates/Apps/DelveDiceHUD/difficulty.hbs`,
	`templates/Apps/DelveDiceHUD/fateCompass.hbs`,
	`templates/Apps/DelveDiceHUD/tour/current.hbs`,
	`templates/Apps/DelveDiceHUD/tour/next.hbs`,
	`templates/Apps/DelveDiceHUD/tour/previous.hbs`,
	`templates/Apps/DicePool/buttons.hbs`,
	`templates/Apps/DicePool/drag.hbs`,
	`templates/Apps/DicePool/edge.hbs`,
	`templates/Apps/DicePool/numberOfDice.hbs`,
	`templates/Apps/DicePool/target.hbs`,
	`templates/Apps/RichEditor/content.hbs`,
	`templates/Apps/SkillsCardV1/content.hbs`,
	`templates/Apps/StatsCardV1/content.hbs`,
	`templates/Apps/partials/item-header.hbs`,
	`templates/Apps/popovers/AmmoTracker/ammoList.hbs`,
	`templates/chat/roll.hbs`,
	`templates/components/armour-summary.hbs`,
];

async function preloadHandlebarsTemplates() {
	const loader = foundry.applications?.handlebars?.loadTemplates ?? globalThis.loadTemplates;
	if (typeof loader !== `function`) {
		Logger.warn(`No public Handlebars template preloader is available`);
		return;
	};

	await loader(preloadedTemplates.map(template => filePath(template)));
};

Hooks.once(`init`, () => {
	Logger.log(`Initializing`);

	CONFIG.Combat.initiative.decimals = 2;
	CONFIG.ui.delveDice = DelveDiceHUD;

	// #region Settings
	registerMetaSettings();
	registerDevSettings();
	registerUserSettings();
	registerWorldSettings();
	// #endregion

	// #region Datamodels
	CONFIG.Actor.dataModels.hero = HeroData;
	CONFIG.Actor.dataModels.geist = GeistData;
	CONFIG.Item.dataModels.ammo = AmmoData;
	CONFIG.Item.dataModels.armour = ArmourData;
	CONFIG.Item.dataModels.craft = CraftData;
	CONFIG.Item.dataModels.good = GoodData;
	CONFIG.Item.dataModels.shield = ShieldData;
	CONFIG.Item.dataModels.skill = SkillData;
	CONFIG.Item.dataModels.weapon = WeaponData;
	// #endregion

	// #region Class Changes
	CONFIG.ui.combat = RipCryptCombatTracker;
	CONFIG.Actor.documentClass = RipCryptActor;
	CONFIG.Combat.documentClass = RipCryptCombat;
	CONFIG.Combatant.documentClass = RipCryptCombatant;
	CONFIG.Token.objectClass = RipCryptToken;
	CONFIG.Item.documentClass = RipCryptItem;
	CONFIG.Dice.terms.d = CryptDie;
	// #endregion

	// #region Sheets
	// #region Actors
	Actors.registerSheet(game.system.id, CombinedHeroSheet, {
		makeDefault: true,
		types: [`hero`],
		label: `RipCrypt.sheet-names.CombinedHeroSheet`,
		themes: CombinedHeroSheet.themes,
	});
	Actors.registerSheet(game.system.id, StatsCardV1, {
		types: [`hero`],
		label: `RipCrypt.sheet-names.StatsCardV1`,
		themes: StatsCardV1.themes,
	});
	Actors.registerSheet(game.system.id, StatsCardV1, {
		makeDefault: true,
		types: [`geist`],
		label: `RipCrypt.sheet-names.StatsCardV1`,
		themes: StatsCardV1.themes,
	});
	Actors.registerSheet(game.system.id, SkillsCardV1, {
		types: [`hero`, `geist`],
		label: `RipCrypt.sheet-names.SkillsCardV1`,
		themes: SkillsCardV1.themes,
	});
	Actors.registerSheet(game.system.id, CraftCardV1, {
		types: [`hero`, `geist`],
		label: `RipCrypt.sheet-names.CraftCardV1`,
		themes: CraftCardV1.themes,
	});
	// #endregion

	// #region Items
	Items.registerSheet(game.system.id, AllItemSheetV1, {
		makeDefault: true,
		label: `RipCrypt.sheet-names.AllItemsSheetV1`,
		themes: AllItemSheetV1.themes,
	});

	Items.registerSheet(game.system.id, ArmourSheet, {
		makeDefault: true,
		types: [`armour`, `shield`],
		label: `RipCrypt.sheet-names.ArmourSheet`,
		themes: ArmourSheet.themes,
	});
	Items.unregisterSheet(game.system.id, AllItemSheetV1, {
		types: [`armour`, `shield`],
	});
	// #endregion
	// #endregion

	// #region Token Attrs
	CONFIG.Actor.trackableAttributes.hero = HeroData.trackableAttributes;
	CONFIG.Actor.trackableAttributes.geist = GeistData.trackableAttributes;
	// #endregion

	registerSockets();
	registerCustomComponents();
	Handlebars.registerHelper(helpers);
	Hooks.on(`renderChatMessageHTML`, onRenderRipCryptChatMessage);
	preloadHandlebarsTemplates().catch(error => {
		Logger.error(`Failed to preload Handlebars templates`, error);
	});
});
