// Pure, side-effect-free mapping between the backend Farm GraphQL shape and the
// farm edit page's form $state. Keep field names in sync with the backend schema
// in backend/graphql/types/farmType.ts (FarmDTO / UpdateFarmInput).
//
// SCOPE: only the CLEAN, unambiguous fields are mapped here. Several controls on
// the edit page (the 5 CHOICE_OPTIONS checkbox groups, the BIPOC radios, the
// seasonal textarea, the combined "Counties and/or Cities Served" field,
// home_county, location, description) have no confirmed backend mapping and are
// intentionally left UNWIRED — see the TODO(backend-mapping) notes below.

import type { FarmStatus } from './farmStatus';

export type { FarmStatus };

/**
 * The subset of backend FarmDTO the edit page reads. Kept minimal — clean fields
 * only. `social_media` is a free-form JSON blob (e.g. { instagram, facebook,
 * other, ... }); its exact keys are not guaranteed by the schema.
 */
export interface FarmDTO {
	id: string;
	usda_farm_id: number | null;
	farm_name: string;
	farm_address: string;
	primary_phone: string;
	primary_email: string;
	website: string | null;
	social_media: SocialMedia | null;
	status: FarmStatus;
}

/** Loose shape of the social_media JSON blob. All keys optional. */
export interface SocialMedia {
	instagram?: string;
	facebook?: string;
	other?: string;
	website?: string;
	[key: string]: string | undefined;
}

/**
 * The CLEAN subset of backend UpdateFarmInput this UI is allowed to send.
 * Matches UpdateFarmInput in backend/graphql/types/farmType.ts (all optional).
 */
export interface UpdateFarmInput {
	farm_name: string;
	farm_address: string;
	primary_phone: string;
	primary_email: string;
	website: string;
	social_media: SocialMedia;
}

/**
 * Exact shape of the `farm` $state object in
 * frontend/src/routes/farmer/farms/[id]/edit/+page.svelte.
 * Downstream +page.server.ts and +page.svelte depend on these key names.
 */
export interface FarmFormModel {
	readableId: string;
	name: string;
	address: string;
	counties: string;
	phone: string;
	email: string;
	instagram: string;
	facebook: string;
	website: string;
	other: string;
	seasonal: string;
	dashboardImageName: string;
}

/** Map a backend FarmDTO onto the edit page's form model. Pure. */
export function farmToFormModel(farm: FarmDTO): FarmFormModel {
	const social = farm.social_media ?? {};

	return {
		// usda_farm_id is the human-readable "Farm ID#" shown on the page.
		readableId: farm.usda_farm_id != null ? String(farm.usda_farm_id) : '',
		name: farm.farm_name ?? '',
		address: farm.farm_address ?? '',
		phone: farm.primary_phone ?? '',
		email: farm.primary_email ?? '',
		// social_media JSON blob -> individual contact fields.
		instagram: social.instagram ?? '',
		facebook: social.facebook ?? '',
		other: social.other ?? '',
		// website has a dedicated clean field; fall back to the blob if present.
		website: farm.website ?? social.website ?? '',

		// TODO(backend-mapping): no confirmed clean source. The backend exposes
		// counties_served / cities_served (arrays) separately, not a single
		// combined string; leave blank until a split/join convention is agreed.
		counties: '',
		// TODO(backend-mapping): no confirmed clean source for the seasonal
		// products free-text field; leave blank (not persisted).
		seasonal: '',
		// TODO(backend-mapping): dashboard image name comes from the file service
		// (StoredFile.original_file_name), not from FarmDTO; wired separately.
		dashboardImageName: ''
	};
}

/**
 * Build the CLEAN UpdateFarmInput from the form model. Pure.
 *
 * Only the six unambiguous fields are sent. The following are intentionally
 * NOT included and must be added later once a confirmed mapping exists:
 *
 * TODO(backend-mapping):
 *   - counties/cities: the combined `counties` string must be split into the
 *     backend's counties_served[] and cities_served[] arrays.
 *   - home_county, location (lat/lng), description: no UI source here.
 *   - food_categories and the boolean/checkbox groups (growing practices, food
 *     safety, experiences, characteristics, school sales) and the BIPOC radios
 *     (bipoc_owned, gap_certified, food_safety_plan, agritourism,
 *     sells_at_markets, csa_boxes, online_sales, delivery, f2s_experience,
 *     interested_in_f2s) — do NOT guess mappings; omitted so they are not
 *     silently overwritten.
 */
export function formModelToUpdateInput(m: FarmFormModel): UpdateFarmInput {
	// Rebuild the social_media JSON blob from the discrete contact fields,
	// omitting empty values to avoid persisting blank keys.
	const social_media: SocialMedia = {};
	if (m.instagram.trim()) social_media.instagram = m.instagram.trim();
	if (m.facebook.trim()) social_media.facebook = m.facebook.trim();
	if (m.other.trim()) social_media.other = m.other.trim();

	return {
		farm_name: m.name,
		farm_address: m.address,
		primary_phone: m.phone,
		primary_email: m.email,
		website: m.website,
		social_media
	};
}
