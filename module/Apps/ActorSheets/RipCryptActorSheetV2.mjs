import { GenericAppMixin } from "../GenericApp.mjs";
import { localizer } from "../../utils/Localizer.mjs";
import { getDragEventData } from "../../utils/TextEditor.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const SUPPORTED_DROP_DOCUMENTS = new Set([
	`Item`,
]);
const DESCENDING_SORT_LIST_CLASSES = new Set([
	`skill-list`,
	`craft-list`,
]);

export class RipCryptActorSheetV2 extends GenericAppMixin(HandlebarsApplicationMixin(ActorSheetV2)) {
	_canDragStart(_selector) {
		return this.isEditable;
	};

	_canDragDrop(_selector) {
		return this.isEditable;
	};

	async _onDrop(event) {
		const data = getDragEventData(event);
		const documentClass = foundry.utils.getDocumentClass(data.type);
		if (!documentClass) {
			ui.notifications.warn(localizer(`RipCrypt.notifs.warn.unsupported-drop`));
			return;
		};

		return super._onDrop(event);
	};

	async _onDropDocument(event, document) {
		if (!SUPPORTED_DROP_DOCUMENTS.has(document.documentName)) {
			ui.notifications.warn(localizer(
				`RipCrypt.notifs.warn.unsupported-drop-document`,
				{ documentName: document.documentName },
			));
			return null;
		};

		return super._onDropDocument(event, document);
	};

	async _onDropItem(event, item) {
		if (!(item.type in CONFIG.Item.dataModels)) {
			ui.notifications.warn(localizer(
				`RipCrypt.notifs.warn.unsupported-item-drop`,
				{ itemType: item.type, itemName: item.name },
			));
			return null;
		};

		return super._onDropItem(event, item);
	};

	_onSortItem(event, item) {
		const dropTarget = event.target.closest(`[data-item-id]`);
		const dropContainer = dropTarget?.parentElement;
		const useDescendingSort = [...(dropContainer?.classList ?? [])]
			.some(className => DESCENDING_SORT_LIST_CLASSES.has(className));
		if (!useDescendingSort) {
			return super._onSortItem(event, item);
		};

		const items = this.actor.items;
		const source = items.get(item.id);
		if (!source || !dropTarget) { return };

		const target = items.get(dropTarget.dataset.itemId);
		if (!target || source.id === target.id) { return };

		const siblings = [];
		for (const element of dropContainer.children) {
			const siblingId = element.dataset.itemId;
			if (siblingId && (siblingId !== source.id)) {
				siblings.push(items.get(siblingId));
			};
		};

		const sortUpdates = foundry.utils.performIntegerSort(source, {
			target,
			siblings,
			sortBefore: (source.sort || 0) < (target.sort || 0),
		});
		const updateData = sortUpdates.map(u => {
			const update = u.update;
			update._id = u.target._id;
			return update;
		});

		return this.actor.updateEmbeddedDocuments(`Item`, updateData);
	};
};
