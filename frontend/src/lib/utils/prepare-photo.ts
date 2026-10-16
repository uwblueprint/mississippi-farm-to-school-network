// Turns whatever a farmer picked or dropped into a file the uploader accepts:
// JPG/PNG pass through, HEIC/HEIF (iPhone photos copied to a computer) are
// converted to JPEG, and anything else — or anything over the size limit — is
// rejected with a message naming the file.
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '$lib/fileDrop';

const HEIC_EXTENSION = /\.(heic|heif)$/i;
const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
const EXTENSION_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png'
};
const JPEG_QUALITY = 0.9;

export function formatMegabytes(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function isHeic(file: File): boolean {
	return HEIC_TYPES.includes(file.type.toLowerCase()) || HEIC_EXTENSION.test(file.name);
}

/** JPG/PNG type for the file, falling back to its extension when the browser left `type` blank. */
function supportedType(file: File): string | null {
	const type = file.type.toLowerCase();
	if (type === 'image/jpeg' || type === 'image/png') return type;
	if (type === 'image/jpg') return 'image/jpeg';
	if (type) return null;
	const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
	return EXTENSION_TYPES[extension] ?? null;
}

/** Safari decodes HEIC natively; re-encode through a canvas. Null when the browser can't. */
async function nativeHeicToJpeg(file: File): Promise<Blob | null> {
	try {
		const bitmap = await createImageBitmap(file);
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
		bitmap.close();
		return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
	} catch {
		return null;
	}
}

async function heicToJpeg(file: File): Promise<File> {
	let blob = await nativeHeicToJpeg(file);
	if (!blob) {
		// Loaded only when needed: the decoder is large and touches `window` on import.
		const { default: heic2any } = await import('heic2any');
		const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
		blob = Array.isArray(converted) ? converted[0] : converted;
	}
	const name = `${file.name.replace(HEIC_EXTENSION, '') || 'photo'}.jpg`;
	return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
}

function tooLargeMessage(file: File, bytes: number, converted: boolean): string {
	const size = converted
		? `${formatMegabytes(bytes)} once converted to JPG`
		: formatMegabytes(bytes);
	return `“${file.name}” is ${size} — photos must be ${MAX_UPLOAD_LABEL} or smaller.`;
}

/**
 * Returns an uploadable JPG/PNG for `file`, converting HEIC to JPEG.
 * @throws Error with a user-facing message when the file can't be used.
 */
export async function preparePhoto(file: File): Promise<File> {
	if (file.size > MAX_UPLOAD_BYTES) throw new Error(tooLargeMessage(file, file.size, false));

	if (isHeic(file)) {
		let converted: File;
		try {
			converted = await heicToJpeg(file);
		} catch {
			throw new Error(
				`“${file.name}” couldn't be converted from HEIC. Export it as a JPG and try again.`
			);
		}
		if (converted.size > MAX_UPLOAD_BYTES) {
			throw new Error(tooLargeMessage(file, converted.size, true));
		}
		return converted;
	}

	const type = supportedType(file);
	if (!type) throw new Error(`“${file.name}” isn't a JPG, PNG or HEIC photo.`);
	return type === file.type
		? file
		: new File([file], file.name, { type, lastModified: file.lastModified });
}

/** Prepares each file, keeping the usable ones and one message per rejected file. */
export async function preparePhotos(files: File[]): Promise<{ photos: File[]; errors: string[] }> {
	const photos: File[] = [];
	const errors: string[] = [];
	for (const file of files) {
		try {
			photos.push(await preparePhoto(file));
		} catch (error) {
			errors.push(error instanceof Error ? error.message : `“${file.name}” couldn't be added.`);
		}
	}
	return { photos, errors };
}
