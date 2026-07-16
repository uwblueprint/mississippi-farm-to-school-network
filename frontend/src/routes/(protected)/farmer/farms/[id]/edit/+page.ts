import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { gqlClient } from '$lib/graphqlClient';
import {
	farmToFormModel,
	type FarmDTO,
	type FarmFormModel,
	type FarmStatus
} from '$lib/farmMapping';

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
			description
			farm_address
			primary_phone
			primary_email
			website
			social_media
			counties_served
			cities_served
			home_county
			food_categories
			bipoc_owned
			gap_certified
			food_safety_plan
			agritourism
			sells_at_markets
			csa_boxes
			online_sales
			delivery
			f2s_experience
			interested_in_f2s
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

const FILES_BY_FARM = `
	query FilesByFarm($farmId: String!) {
		filesByFarm(farmId: $farmId) {
			fileId
			url
			originalFileName
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
	const status: FarmStatus = farm.status;

	// Rejection banner + image gallery are independent and non-fatal — degrade to
	// null / [] if either fails so the page still renders.
	const [rejectionRes, imagesRes] = await Promise.allSettled([
		gqlClient<{
			latestActiveFarmRejection: { rejection_reason: string; created_at: string } | null;
		}>(LATEST_REJECTION, { farmId: id }),
		gqlClient<{ filesByFarm: FarmImage[] }>(FILES_BY_FARM, { farmId: id })
	]);

	let rejection: RejectionInfo | null = null;
	if (rejectionRes.status === 'fulfilled') {
		const r = rejectionRes.value.latestActiveFarmRejection;
		if (r) {
			rejection = { reason: r.rejection_reason, createdAt: r.created_at };
		}
	}

	const images: FarmImage[] =
		imagesRes.status === 'fulfilled' ? (imagesRes.value.filesByFarm ?? []) : [];

	// The dashboard image name comes from the file service, not FarmDTO — overlay
	// the first uploaded image's name if any.
	if (images.length > 0) {
		form.dashboardImageName = images[0].originalFileName;
	}

	return { form, status, rejection, images };
};
