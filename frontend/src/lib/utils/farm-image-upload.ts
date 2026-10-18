import { refreshAuthTokenCookie } from '$lib/auth';
import { preparePhoto } from '$lib/utils/prepare-photo';

type ImageDimensions = {
	width: number;
	height: number;
};

type ApiErrorBody = {
	ok?: boolean;
	errors?: Array<{ message?: string }>;
};

function apiErrorMessage(body: ApiErrorBody, fallback: string): string {
	return body.errors?.[0]?.message ?? fallback;
}

/** POST to a cookie-authenticated server route, failing instead of hanging if it stalls. */
function postJson(url: string, body: unknown): Promise<Response> {
	return fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(30_000)
	});
}

async function getImageDimensions(file: File): Promise<ImageDimensions> {
	const bitmap = await createImageBitmap(file);
	const dimensions = { width: bitmap.width, height: bitmap.height };
	bitmap.close();
	return dimensions;
}

/**
 * Upload one photo to GCS via signed URL and register it in the `images`
 * collection. Returns the new image id (also used as cover_photo /
 * carousel_photos entries).
 */
export async function uploadFarmPhoto(farmId: string, original: File): Promise<string> {
	const file = await preparePhoto(original);
	const contentType = file.type;
	const dimensions = await getImageDimensions(file);
	await refreshAuthTokenCookie();

	const requestRes = await postJson('/api/farm-images/request-upload', { farmId, contentType });
	const requestBody = await requestRes.json();
	if (!requestRes.ok || !requestBody.ok) {
		throw new Error(apiErrorMessage(requestBody, 'Failed to request image upload URL.'));
	}

	const putRes = await fetch(requestBody.uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': contentType },
		body: file
	});
	if (!putRes.ok) {
		throw new Error(`Failed to upload ${file.name} to storage.`);
	}

	const confirmRes = await postJson('/api/farm-images/confirm-upload', {
		imageId: requestBody.imageId,
		farmId,
		contentType,
		size: file.size,
		dimensions
	});
	const confirmBody = await confirmRes.json();
	if (!confirmRes.ok || !confirmBody.ok) {
		throw new Error(apiErrorMessage(confirmBody, `Failed to register ${file.name}.`));
	}

	return confirmBody.image.id as string;
}

/**
 * Upload photos to GCS via signed URLs, register image rows, then set
 * cover_photo / carousel_photos on the farm to those image IDs.
 */
export async function attachFarmPhotos(
	farmId: string,
	photos: File[],
	coverIndex: number
): Promise<void> {
	if (photos.length === 0) return;

	const imageIds: string[] = [];

	for (const file of photos) {
		imageIds.push(await uploadFarmPhoto(farmId, file));
	}

	const safeCoverIndex = coverIndex >= 0 && coverIndex < imageIds.length ? coverIndex : 0;
	const cover_photo = imageIds[safeCoverIndex];
	const carousel_photos = imageIds.filter((_, index) => index !== safeCoverIndex);

	await refreshAuthTokenCookie();
	const updateRes = await postJson('/api/update-farm', {
		id: farmId,
		input: { cover_photo, carousel_photos }
	});
	const updateBody = await updateRes.json();
	if (!updateRes.ok || !updateBody.ok) {
		throw new Error(apiErrorMessage(updateBody, 'Failed to attach photos to farm.'));
	}
}
