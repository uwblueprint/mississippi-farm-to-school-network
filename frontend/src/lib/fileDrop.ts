// Shared drag-and-drop file handling for the upload surfaces (UploadZone and the
// PhotoGallery "Add Photos" tile). Kept in one place so the drop targets can't
// drift apart — in particular the accept-filtering, which is the part that
// actually matters for correctness (see isAccepted).

/** The image formats the farm image uploader accepts. */
export const IMAGE_ACCEPT = 'image/png,image/jpeg';

/**
 * An <input type="file"> enforces `accept` for the user, but a DROP does not —
 * anything at all can be dropped onto a target. This filter is the only thing
 * keeping non-images out of the uploader.
 *
 * Supports the three `accept` forms: exact MIME ("image/png"), wildcard
 * ("image/*"), and extension (".png").
 */
export function isAccepted(file: File, accept: string): boolean {
	const patterns = accept
		.split(',')
		.map((pattern) => pattern.trim())
		.filter(Boolean);
	if (patterns.length === 0) return true;

	return patterns.some((pattern) => {
		if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
		if (pattern.endsWith('/*')) return file.type.startsWith(pattern.slice(0, -1));
		return file.type === pattern;
	});
}

/**
 * Rebuild a FileList from plain Files, so drop callers can hand back the same
 * type the <input type="file"> path produces (onFiles takes a FileList).
 */
export function toFileList(files: File[]): FileList {
	const transfer = new DataTransfer();
	for (const file of files) transfer.items.add(file);
	return transfer.files;
}

export interface DropResult {
	/** The accepted files, or null when there is nothing worth uploading. */
	files: FileList | null;
	/** User-facing message when some or all dropped files were rejected. */
	error: string;
}

/** Pull the acceptable files out of a drop event, filtering the rest. */
export function filesFromDrop(event: DragEvent, accept: string, multiple: boolean): DropResult {
	const dropped = Array.from(event.dataTransfer?.files ?? []);
	if (dropped.length === 0) {
		return { files: null, error: '' };
	}

	let valid = dropped.filter((file) => isAccepted(file, accept));
	if (!multiple) valid = valid.slice(0, 1);

	if (valid.length === 0) {
		return { files: null, error: 'Only JPG or PNG images can be uploaded.' };
	}
	return {
		files: toFileList(valid),
		error: valid.length < dropped.length ? 'Some files were skipped — JPG or PNG only.' : ''
	};
}

/**
 * Dropping a file anywhere OUTSIDE a drop target makes the browser navigate to
 * it, silently discarding unsaved form edits. Call from onMount and use the
 * returned cleanup on unmount. Element-level drop handlers still run normally.
 */
export function suppressWindowDrop(): () => void {
	const prevent = (event: DragEvent) => event.preventDefault();
	window.addEventListener('dragover', prevent);
	window.addEventListener('drop', prevent);
	return () => {
		window.removeEventListener('dragover', prevent);
		window.removeEventListener('drop', prevent);
	};
}
