export const TextEditor = foundry.applications.ux.TextEditor.implementation;

export function enrichHTML(...args) {
	return TextEditor.enrichHTML(...args);
};

export function getDragEventData(event) {
	return TextEditor.getDragEventData(event);
};
