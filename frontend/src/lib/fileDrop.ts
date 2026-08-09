// Shared drag-and-drop file handling for the upload surfaces (UploadZone and the
// PhotoGallery "Add Photos" tile). Kept in one place so the drop targets can't
// drift apart — in particular the accept-filtering, which is the part that
// actually matters for correctness (see isAccepted).

/** The image formats the farm image uploader accepts. */
export const IMAGE_ACCEPT = 'image/png,image/jpeg';

// Base64 inflates bytes by ~4/3, so this caps a single request near 14MB — well
// under apollo-server's 50mb body limit, past which the 413 comes back as plain
// text and never parses as JSON. Mirrored by MAX_UPLOAD_BYTES in
// backend/graphql/resolvers/fileStorageResolvers.ts; keep the two in sync.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** MAX_UPLOAD_BYTES in the form the rejection copy shows users. */
export const MAX_UPLOAD_LABEL = '10MB';

/**
 * An <input type="file"> enforces `accept` for the user, but a DROP does not —
 * anything at all can be dropped onto a target. This filter is the only thing
 * keeping non-images out of the uploader.
 *
 * Supports the three `accept` forms: exact MIME ("image/png"), wildcard
 * ("image/*"), and extension (".png").
 */
function isAccepted(file: File, accept: string): boolean {
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
function toFileList(files: File[]): FileList {
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

	const accepted = dropped.filter((file) => isAccepted(file, accept));
	const withinLimit = accepted.filter((file) => file.size <= MAX_UPLOAD_BYTES);
	const valid = multiple ? withinLimit : withinLimit.slice(0, 1);

	const wrongType = accepted.length < dropped.length;
	const oversized = withinLimit.length < accepted.length;

	if (valid.length === 0) {
		return {
			files: null,
			error: oversized
				? `Images must be under ${MAX_UPLOAD_LABEL}.`
				: 'Only JPG or PNG images can be uploaded.'
		};
	}

	let error = '';
	if (oversized) error = `Some files were skipped — images must be under ${MAX_UPLOAD_LABEL}.`;
	else if (wrongType) error = 'Some files were skipped — JPG or PNG only.';

	return { files: toFileList(valid), error };
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
