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

async function getImageDimensions(file: File): Promise<ImageDimensions> {
	const bitmap = await createImageBitmap(file);
	const dimensions = { width: bitmap.width, height: bitmap.height };
	bitmap.close();
	return dimensions;
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

	for (let index = 0; index < photos.length; index += 1) {
		const file = photos[index];
		const contentType = file.type || 'image/jpeg';
		const dimensions = await getImageDimensions(file);

		const requestRes = await fetch('/api/farm-images/request-upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ farmId, contentType })
		});
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

		const confirmRes = await fetch('/api/farm-images/confirm-upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				imageId: requestBody.imageId,
				farmId,
				contentType,
				size: file.size,
				dimensions
			})
		});
		const confirmBody = await confirmRes.json();
		if (!confirmRes.ok || !confirmBody.ok) {
			throw new Error(apiErrorMessage(confirmBody, `Failed to register ${file.name}.`));
		}

		imageIds.push(confirmBody.image.id);
	}

	const safeCoverIndex = coverIndex >= 0 && coverIndex < imageIds.length ? coverIndex : 0;
	const cover_photo = imageIds[safeCoverIndex];
	const carousel_photos = imageIds.filter((_, index) => index !== safeCoverIndex);

	const updateRes = await fetch('/api/update-farm', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: farmId,
			input: { cover_photo, carousel_photos }
		})
	});
	const updateBody = await updateRes.json();
	if (!updateRes.ok || !updateBody.ok) {
		throw new Error(apiErrorMessage(updateBody, 'Failed to attach photos to farm.'));
	}
}
