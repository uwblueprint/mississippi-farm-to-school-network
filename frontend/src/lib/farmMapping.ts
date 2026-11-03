// Pure, side-effect-free mapping between the backend Farm GraphQL shape and the
// farm edit page's form $state. Keep field names in sync with the backend schema
// in backend/graphql/types/farmType.ts (FarmDTO / UpdateFarmInput).
//
// Only the locked farm fields (plus cities served) are mapped here. Every other
// question is sent in `answers`; the backend copies those onto the farm's fields.
//
// STILL UNWIRED (needs dedicated UI):
//   - location (lat/lng — needs a map/geocoder), market_sales_data (repeatable
//     { market, times } rows). Omitting them from UpdateFarmInput leaves the
//     stored values untouched.

import type { FarmStatus } from '$lib/types/farm';
import type { FormAnswers, FormVersion } from '$lib/types/form';

export type { FarmStatus };

/** The subset of backend FarmDTO the edit page reads. */
export interface FarmDTO {
	id: string;
	usda_farm_id: string | null;
	farm_name: string;
	farm_address: string;
	county: string;
	cities_served: string[] | null;
	primary_phone: string;
	primary_email: string;
	/** stored_files id of the cover ("Dashboard") image; not a URL. */
	cover_photo: string | null;
	/** stored_files ids of the Photo Gallery images, in display order. */
	carousel_photos: string[];
	status: FarmStatus;
	deletion_requested_at?: string | null;
	formVersion: FormVersion;
	answers: FormAnswers;
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
	answers: FormAnswers;
}

/**
 * The locked fields of the `farm` $state object in
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
	return {
		// usda_farm_id is the human-readable "Farm ID#" shown on the page.
		readableId: farm.usda_farm_id ?? '',
		name: farm.farm_name ?? '',
		address: farm.farm_address ?? '',
		county: farm.county ?? '',
		// cities_served[] -> comma-separated text field.
		cities: joinList(farm.cities_served),
		phone: farm.primary_phone ?? '',
		email: farm.primary_email ?? ''
	};
}

/** Build the UpdateFarmInput from the form model and the (already cleaned) answers. Pure. */
export function formModelToUpdateInput(m: FarmFormModel, answers: FormAnswers): UpdateFarmInput {
	return {
		farm_name: m.name,
		farm_address: m.address,
		county: m.county.trim(),
		cities_served: splitList(m.cities),
		primary_phone: m.phone,
		primary_email: m.email,
		answers
	};
}
