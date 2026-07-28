// Pure, side-effect-free mapping between the backend Farm GraphQL shape and the
// farm edit page's form $state. Keep field names in sync with the backend schema
// in backend/graphql/types/farmType.ts (FarmDTO / UpdateFarmInput).
//
// The option-list fields (growing_practices, seasonal/meat/other_products,
// food_safety_certifications, farm_experiences, farm_characteristics,
// farm_to_school_sales) are string arrays holding the option labels verbatim,
// so the checkbox groups bind to them directly — the allowed labels live in
// $lib/constants/farmOptions (mirroring backend/constants/farmOptions.ts).
//
// STILL UNWIRED (needs dedicated UI):
//   - location (lat/lng — needs a map/geocoder), market_sales_data (repeatable
//     { market, times } rows), meat/other_products_detail, minimum_order,
//     delivery_details. Omitting them from UpdateFarmInput leaves the stored
//     values untouched.

import type { FarmStatus } from '$lib/types/farm';

export type { FarmStatus };

/**
 * The subset of backend FarmDTO the edit page reads. `social_media` is a
 * free-form JSON blob (e.g. { instagram, facebook, other, ... }); its exact
 * keys are not guaranteed by the schema.
 */
export interface FarmDTO {
	id: string;
	usda_farm_id: string | null;
	farm_name: string;
	farm_address: string;
	county: string;
	cities_served: string[] | null;
	primary_phone: string;
	primary_email: string;
	website: string | null;
	social_media: SocialMedia | null;
	seasonal_products: string[];
	meat_products: string[];
	other_products: string[];
	seasonal_products_detail: string | null;
	growing_practices: string[];
	food_safety_certifications: string[];
	farm_experiences: string[];
	farm_characteristics: string[];
	farm_to_school_sales: string[];
	/** stored_files id of the cover ("Dashboard") image; not a URL. */
	cover_photo: string | null;
	/** stored_files ids of the Photo Gallery images, in display order. */
	carousel_photos: string[];
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
 * The subset of backend UpdateFarmInput this UI sends. All UpdateFarmInput
 * fields are optional server-side; fields not listed here are never touched.
 */
export interface UpdateFarmInput {
	farm_name: string;
	farm_address: string;
	county: string;
	cities_served: string[];
	primary_phone: string;
	primary_email: string;
	website: string;
	social_media: SocialMedia;
	seasonal_products: string[];
	meat_products: string[];
	other_products: string[];
	seasonal_products_detail: string;
	growing_practices: string[];
	food_safety_certifications: string[];
	farm_experiences: string[];
	farm_characteristics: string[];
	farm_to_school_sales: string[];
}

/**
 * Exact shape of the `farm` $state object in
 * frontend/src/routes/(protected)/farmer/farms/[id]/edit/+page.svelte.
 * Downstream +page.ts and +page.svelte depend on these key names.
 */
export interface FarmFormModel {
	readableId: string;
	name: string;
	address: string;
	/** Single county; maps to `county`. */
	county: string;
	/** Comma-separated; maps to cities_served[]. */
	cities: string;
	phone: string;
	email: string;
	instagram: string;
	facebook: string;
	website: string;
	other: string;
	/** Not a form control: the loaded social_media keys with no control, held so
	 *  formModelToUpdateInput can send them back unchanged. */
	unmanagedSocialMedia: SocialMedia;
	/** Selected labels, stored verbatim in their backend string-array columns. */
	growingPractices: string[];
	seasonalProducts: string[];
	meatProducts: string[];
	otherProducts: string[];
	foodSafety: string[];
	experiences: string[];
	characteristics: string[];
	schoolSales: string[];
	/** Free text; maps to seasonal_products_detail. */
	seasonal: string;
}

/** The social_media blob keys that have a form control and are rewritten on save. */
const FORM_MANAGED_SOCIAL_KEYS = new Set(['instagram', 'facebook', 'other', 'website']);

/**
 * The blob keys with no form control (e.g. twitter, youtube set by admin tooling
 * or an import). The backend REPLACES social_media wholesale rather than merging
 * it, so these must ride through the form model or an edit would drop them. Pure.
 */
function unmanagedSocial(social: SocialMedia): SocialMedia {
	return Object.fromEntries(
		Object.entries(social).filter(([key]) => !FORM_MANAGED_SOCIAL_KEYS.has(key))
	);
}

/** backend string[] -> comma-separated form field. Pure. */
function joinList(values: string[] | null | undefined): string {
	return (values ?? []).join(', ');
}

/**
 * Comma-separated form field -> backend string[]. Trims entries and drops empty
 * ones, so "A, , B," yields ["A","B"] and "" yields []. Pure.
 */
function splitList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

/** Map a backend FarmDTO onto the edit page's form model. Pure. */
export function farmToFormModel(farm: FarmDTO): FarmFormModel {
	const social = farm.social_media ?? {};

	return {
		// usda_farm_id is the human-readable "Farm ID#" shown on the page.
		readableId: farm.usda_farm_id ?? '',
		name: farm.farm_name ?? '',
		address: farm.farm_address ?? '',
		county: farm.county ?? '',
		// cities_served[] -> comma-separated text field.
		cities: joinList(farm.cities_served),
		phone: farm.primary_phone ?? '',
		email: farm.primary_email ?? '',
		// social_media JSON blob -> individual contact fields.
		instagram: social.instagram ?? '',
		facebook: social.facebook ?? '',
		other: social.other ?? '',
		// website has a dedicated clean field; fall back to the blob if present.
		website: farm.website ?? social.website ?? '',
		unmanagedSocialMedia: unmanagedSocial(social),

		// Option arrays store the selected labels themselves.
		growingPractices: farm.growing_practices ?? [],
		seasonalProducts: farm.seasonal_products ?? [],
		meatProducts: farm.meat_products ?? [],
		otherProducts: farm.other_products ?? [],
		foodSafety: farm.food_safety_certifications ?? [],
		experiences: farm.farm_experiences ?? [],
		characteristics: farm.farm_characteristics ?? [],
		schoolSales: farm.farm_to_school_sales ?? [],

		seasonal: farm.seasonal_products_detail ?? ''
	};
}

/** Build the UpdateFarmInput from the form model. Pure. */
export function formModelToUpdateInput(m: FarmFormModel): UpdateFarmInput {
	// Rebuild the social_media JSON blob from the discrete contact fields,
	// omitting empty values to avoid persisting blank keys. Keys with no form
	// control are carried over as-is (the backend replaces the blob wholesale).
	const social_media: SocialMedia = { ...m.unmanagedSocialMedia };
	if (m.instagram.trim()) social_media.instagram = m.instagram.trim();
	if (m.facebook.trim()) social_media.facebook = m.facebook.trim();
	if (m.other.trim()) social_media.other = m.other.trim();

	return {
		farm_name: m.name,
		farm_address: m.address,
		county: m.county.trim(),
		cities_served: splitList(m.cities),
		primary_phone: m.phone,
		primary_email: m.email,
		website: m.website,
		social_media,
		growing_practices: m.growingPractices,
		seasonal_products: m.seasonalProducts,
		meat_products: m.meatProducts,
		other_products: m.otherProducts,
		seasonal_products_detail: m.seasonal,
		food_safety_certifications: m.foodSafety,
		farm_experiences: m.experiences,
		farm_characteristics: m.characteristics,
		farm_to_school_sales: m.schoolSales
	};
}
