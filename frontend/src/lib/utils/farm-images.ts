import type { MapFarm } from '$lib/types/farm';

export type FarmImageDto = {
	id: string;
	index: number;
	url: string;
	contentType?: string;
};

const FALLBACK_THUMBNAIL = '/images/mfsnLogo.svg';

/**
 * Order image IDs: cover first, then carousel_photos, then any remaining by index.
 */
export function orderFarmImageIds(
	images: FarmImageDto[],
	coverPhoto: string | null,
	carouselPhotos: string[]
): string[] {
	const byId = new Map(images.map((image) => [image.id, image]));
	const ordered: string[] = [];

	if (coverPhoto && byId.has(coverPhoto)) {
		ordered.push(coverPhoto);
	}

	for (const id of carouselPhotos) {
		if (byId.has(id) && !ordered.includes(id)) {
			ordered.push(id);
		}
	}

	const remaining = [...images]
		.sort((a, b) => a.index - b.index)
		.map((image) => image.id)
		.filter((id) => !ordered.includes(id));

	return [...ordered, ...remaining];
}

export function displayImagesFromFarmImages(
	images: FarmImageDto[],
	coverPhoto: string | null,
	carouselPhotos: string[]
): Pick<MapFarm, 'imageUrls' | 'thumbnailUrl'> {
	const byId = new Map(images.map((image) => [image.id, image.url]));
	const orderedIds = orderFarmImageIds(images, coverPhoto, carouselPhotos);
	const imageUrls = orderedIds
		.map((id) => byId.get(id))
		.filter((url): url is string => Boolean(url));

	if (imageUrls.length === 0) {
		return { imageUrls: [], thumbnailUrl: FALLBACK_THUMBNAIL };
	}

	return { imageUrls, thumbnailUrl: imageUrls[0] };
}

/** Fetch signed image URLs for one farm via the getImages proxy. */
export async function resolveFarmDisplayImages(
	farm: Pick<MapFarm, 'id' | 'cover_photo' | 'carousel_photos'>
): Promise<Pick<MapFarm, 'imageUrls' | 'thumbnailUrl'>> {
	try {
		const res = await fetch(`/api/farm-images?farmId=${encodeURIComponent(farm.id)}`);
		const body = await res.json();

		if (!res.ok || !body.ok) {
			return { imageUrls: [], thumbnailUrl: FALLBACK_THUMBNAIL };
		}

		return displayImagesFromFarmImages(
			(body.images ?? []) as FarmImageDto[],
			farm.cover_photo,
			farm.carousel_photos ?? []
		);
	} catch {
		return { imageUrls: [], thumbnailUrl: FALLBACK_THUMBNAIL };
	}
}
