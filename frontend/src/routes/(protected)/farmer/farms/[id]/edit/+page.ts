import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { gqlClient } from '$lib/graphqlClient';
import { farmToFormModel, type FarmDTO, type FarmFormModel } from '$lib/farmMapping';

// Client-side load: the (protected) subtree is `ssr = false` and authenticates
// with the Firebase ID token (via gqlClient), not a server cookie. Mirrors the
// data the previous +page.server.ts loader returned (SHARED CONTRACT with
// +page.svelte: { form, status, rejection, images }).

const FARM_BY_ID = `
	query FarmById($id: ID!) {
		farmById(id: $id) {
			id
			usda_farm_id
			farm_name
			farm_address
			county
			cities_served
			primary_phone
			primary_email
			website
			social_media
			seasonal_products
			meat_products
			other_products
			seasonal_products_detail
			growing_practices
			food_safety_certifications
			farm_experiences
			farm_characteristics
			farm_to_school_sales
			cover_photo
			carousel_photos
			status
		}
	}
`;

const LATEST_REJECTION = `
	query LatestActiveFarmRejection($farmId: ID!) {
		latestActiveFarmRejection(farmId: $farmId) {
			rejection_reason
			created_at
		}
	}
`;

// Same `images` collection used by new-farm upload + admin/map galleries
// (not the legacy stored_files / filesByFarm path).
const GET_IMAGES = `
	query GetImages($farmId: String!) {
		getImages(farmId: $farmId) {
			id
			index
			url
			contentType
		}
	}
`;

interface FarmImage {
	fileId: string;
	url: string;
	originalFileName: string;
}

interface RejectionInfo {
	reason: string;
	createdAt: string;
}

// Map a thrown gqlClient error onto the right SvelteKit navigation outcome.
function toHttpError(err: unknown): never {
	const message = err instanceof Error ? err.message : String(err);
	if (/logged in|signed in|unauthenticated/i.test(message)) {
		throw redirect(307, '/login');
	}
	if (/not found/i.test(message)) {
		throw error(404, 'Farm not found');
	}
	if (/forbidden|not authorized|permission|do not have/i.test(message)) {
		throw error(403, 'You do not have access to this farm');
	}
	throw error(500, message);
}

export const load: PageLoad = async ({ params }) => {
	const id = params.id;

	let farm: FarmDTO;
	try {
		const data = await gqlClient<{ farmById: FarmDTO }>(FARM_BY_ID, { id });
		farm = data.farmById;
	} catch (err) {
		toHttpError(err);
	}

	const form: FarmFormModel = farmToFormModel(farm);

	// Rejection banner + image gallery are independent and non-fatal — degrade to
	// null / [] if either fails so the page still renders.
	const [rejectionRes, imagesRes] = await Promise.allSettled([
		gqlClient<{
			latestActiveFarmRejection: { rejection_reason: string; created_at: string } | null;
		}>(LATEST_REJECTION, { farmId: id }),
		gqlClient<{
			getImages: Array<{ id: string; index: number; url: string; contentType: string }>;
		}>(GET_IMAGES, { farmId: id })
	]);

	const r =
		rejectionRes.status === 'fulfilled' ? rejectionRes.value.latestActiveFarmRejection : null;
	const rejection: RejectionInfo | null = r
		? { reason: r.rejection_reason, createdAt: r.created_at }
		: null;

	const images: FarmImage[] =
		imagesRes.status === 'fulfilled'
			? (imagesRes.value.getImages ?? []).map((img) => ({
					fileId: img.id,
					url: img.url,
					originalFileName:
						img.contentType === 'image/png'
							? `Photo ${img.index + 1}.png`
							: `Photo ${img.index + 1}.jpg`
				}))
			: [];

	// Split into cover / gallery buckets. cover_photo / carousel_photos hold
	// `images` collection ids (URLs are short-lived, so files are re-resolved
	// via getImages on every load).
	//
	// coverId/galleryIds are the PERSISTED ids and are what bucket writes must be
	// based on; cover/gallery are the display subset (an id whose signed-URL
	// resolution transiently failed is kept in galleryIds so an unrelated edit
	// doesn't silently evict it from carousel_photos).
	const byId = new Map(images.map((img) => [img.fileId, img]));
	let coverId: string | null = farm.cover_photo ?? null;
	let galleryIds: string[] = farm.carousel_photos ?? [];
	let cover: FarmImage | null = coverId ? (byId.get(coverId) ?? null) : null;
	let gallery: FarmImage[] = galleryIds
		.map((fileId) => byId.get(fileId))
		.filter((img): img is FarmImage => img !== undefined);

	// Farms from before the buckets existed have files but empty bucket columns:
	// show them under the legacy convention (first upload = cover, rest = gallery).
	// The first bucket edit persists this full split (both columns).
	if (!coverId && galleryIds.length === 0 && images.length > 0) {
		cover = images[0];
		coverId = images[0].fileId;
		gallery = images.slice(1);
		galleryIds = gallery.map((img) => img.fileId);
	}

	return { form, status: farm.status, rejection, cover, coverId, gallery, galleryIds };
};
