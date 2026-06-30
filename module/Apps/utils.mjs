/*
This file contains utilities used by Applications in order to be DRYer
*/

const { getProperty } = foundry.utils;

function resolveTargetElement(target) {
	if (target instanceof HTMLElement) { return target };
	if (target?.currentTarget instanceof HTMLElement) { return target.currentTarget };
	if (target?.target instanceof HTMLElement) { return target.target };
	return null;
};

/**
 * @param {HTMLElement} target The element to operate on
 */
export async function createItemFromElement(target, { parent } = {}) {
	if (parent && !parent.isOwner) { return };
	target = resolveTargetElement(target);
	if (!target) { return };

	const data = target.dataset;
	const types = data.itemTypes
		?.split(`,`)
		.map(type => type.trim())
		.filter(Boolean);
	const type = data.defaultItemType ?? (types?.length === 1 ? types[0] : undefined);
	if (!type && !types?.length) { return };

	await Item.createDialog(
		{ type },
		{ parent, showEquipPrompt: false },
		{
			types,
			folders: [],
		},
	);
};

/**
 * @param {HTMLElement} target The element to operate on
 */
export async function editItemFromElement(target) {
	target = resolveTargetElement(target);
	if (!target) { return };
	const itemEl = target.closest(`[data-item-id]`);
	if (!itemEl) { return };
	const itemId = itemEl.dataset.itemId;
	if (!itemId) { return };
	const item = await fromUuid(itemId);
	if (!item?.sheet) { return };
	item.sheet.render({ force: true, orBringToFront: true });
};

/**
 * @param {HTMLElement} target The element to operate on
 */
export async function deleteItemFromElement(target) {
	target = resolveTargetElement(target);
	if (!target) { return };
	const itemEl = target.closest(`[data-item-id]`);
	if (!itemEl) { return };
	const itemId = itemEl.dataset.itemId;
	if (!itemId) { return };
	const item = await fromUuid(itemId);
	if (!item) { return };
	await item.deleteDialog();
};

/**
 * Updates a document using the UUID, expects there to be the following
 * dataset attributes:
 *   - "data-foreign-uuid" : The UUID of the document to update
 *   - "data-foreign-name" : The dot-separated path of the value to update
 *
 * @param {Event} event
 */
export async function updateForeignDocumentFromEvent(event) {
	const target = event.currentTarget;
	const data = target.dataset;
	const {
		foreignUuid,
		foreignName,
	} = data;

	if (!foreignUuid || !foreignName) { return };

	const document = await fromUuid(foreignUuid);
	if (!document?.isOwner) { return };

	let value = target.value;
	switch (target.type) {
		case `checkbox`: value = target.checked; break;
		case `number`: {
			const current = getProperty(document, foreignName);
			if (target.value === `` || Number.isNaN(target.valueAsNumber)) {
				if (typeof current === `number`) {
					target.value = String(current);
				};
				return;
			};
			value = target.valueAsNumber;
			break;
		};
	};

	if (Object.is(getProperty(document, foreignName), value)) { return };
	await document.update({ [foreignName]: value });
};
