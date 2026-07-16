// Pure, side-effect-free mapping between the backend Farm GraphQL shape and the
// farm edit page's form $state. Keep field names in sync with the backend schema
// in backend/graphql/types/farmType.ts (FarmDTO / UpdateFarmInput).
//
// SCOPE: every backend field with a sensible form control is mapped here.
//
// Counties/Cities: two separate fields map 1:1 onto counties_served[] /
// cities_served[] (comma-separated in the UI, split/joined here). They are kept
// distinct because both arrays are filtered on (see farmService.getFarms).
//
// Booleans: the backend's 10 farm flags are surfaced as themed checkbox groups —
// each checkbox corresponds to exactly one boolean column. The label<->column
// mapping lives in the *_OPTIONS tables below, which are the single source of
// truth for both the UI options and the read/write mapping.
//
// STILL UNWIRED (no backend column exists — would need a migration):
//   - growingPractices ("Growing Practices" checkbox group)
//   - seasonal ("Seasonal product and products offered")
// STILL UNWIRED (needs dedicated UI):
//   - location (lat/lng — needs a map/geocoder), market_sales_data (repeatable
//     { market, times } rows)

import type { FarmStatus } from './farmStatus';

export type { FarmStatus };

/** The backend Farm boolean columns surfaced as checkboxes. */
export type FarmBooleanField =
	| 'bipoc_owned'
	| 'gap_certified'
	| 'food_safety_plan'
	| 'agritourism'
	| 'sells_at_markets'
	| 'csa_boxes'
	| 'online_sales'
	| 'delivery'
	| 'f2s_experience'
	| 'interested_in_f2s';

/** One checkbox: the label shown in the UI and the boolean column it drives. */
export interface BooleanFieldOption {
	label: string;
	field: FarmBooleanField;
}

// --- Checkbox group definitions (UI options + backend mapping) ---------------
// Together these cover all 10 boolean columns exactly once.

export const FOOD_SAFETY_OPTIONS: BooleanFieldOption[] = [
	{ label: 'GAP/GHP certified', field: 'gap_certified' },
	{ label: 'Has a food safety plan', field: 'food_safety_plan' }
];

export const EXPERIENCE_OPTIONS: BooleanFieldOption[] = [
	{ label: 'Offers agritourism', field: 'agritourism' },
	{ label: 'Offers CSA boxes', field: 'csa_boxes' },
	{ label: 'Sells at farmers markets', field: 'sells_at_markets' },
	{ label: 'Online sales/ordering', field: 'online_sales' },
	{ label: 'Offers delivery', field: 'delivery' }
];

export const CHARACTERISTIC_OPTIONS: BooleanFieldOption[] = [
	{ label: 'BIPOC-owned', field: 'bipoc_owned' }
];

export const SCHOOL_SALES_OPTIONS: BooleanFieldOption[] = [
	{ label: 'Has sold to schools or ECE centers before', field: 'f2s_experience' },
	{ label: 'Interested in selling to schools or ECE centers', field: 'interested_in_f2s' }
];

/** food_categories[] is a free taxonomy, not booleans — plain string options. */
export const FOOD_CATEGORY_OPTIONS: string[] = [
	'Vegetables',
	'Fruits',
	'Grains',
	'Dairy',
	'Meats'
];

/** TODO(backend-mapping): no `growing_practices` column exists, so this group is
 *  local-only until one is added. */
export const GROWING_PRACTICE_OPTIONS: string[] = [
	'Organic Practices',
	'Conventional',
	'Regenerative',
	'Hydroponic',
	'Aquaponic',
	'Biodynamic',
	'None of the above'
];

/** The labels for a group, for passing straight to <ChoiceGroup options={...}>. */
export function optionLabels(options: BooleanFieldOption[]): string[] {
	return options.map((option) => option.label);
}

/**
 * The subset of backend FarmDTO the edit page reads. Kept minimal — clean fields
 * only. `social_media` is a free-form JSON blob (e.g. { instagram, facebook,
 * other, ... }); its exact keys are not guaranteed by the schema.
 */
export type FarmDTO = {
	id: string;
	usda_farm_id: number | null;
	farm_name: string;
	description: string;
	farm_address: string;
	primary_phone: string;
	primary_email: string;
	website: string | null;
	social_media: SocialMedia | null;
	counties_served: string[];
	cities_served: string[];
	home_county: string;
	food_categories: string[];
	status: FarmStatus;
} & Record<FarmBooleanField, boolean>;

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
export type UpdateFarmInput = {
	farm_name: string;
	description: string;
	farm_address: string;
	primary_phone: string;
	primary_email: string;
	website: string;
	social_media: SocialMedia;
	counties_served: string[];
	cities_served: string[];
	home_county: string;
	food_categories: string[];
} & Record<FarmBooleanField, boolean>;

/**
 * Exact shape of the `farm` $state object in
 * frontend/src/routes/farmer/farms/[id]/edit/+page.svelte.
 * Downstream +page.server.ts and +page.svelte depend on these key names.
 */
export interface FarmFormModel {
	readableId: string;
	name: string;
	description: string;
	address: string;
	/** Comma-separated; maps to counties_served[]. */
	counties: string;
	/** Comma-separated; maps to cities_served[]. */
	cities: string;
	/** Single county; maps to home_county. */
	homeCounty: string;
	phone: string;
	email: string;
	instagram: string;
	facebook: string;
	website: string;
	other: string;
	/** Selected labels from FOOD_CATEGORY_OPTIONS; maps to food_categories[]. */
	foodCategories: string[];
	/** Selected labels; each maps to one boolean column (see *_OPTIONS above). */
	foodSafety: string[];
	experiences: string[];
	characteristics: string[];
	schoolSales: string[];
	/** TODO(backend-mapping): no backend column — local UI state only. */
	growingPractices: string[];
	/** TODO(backend-mapping): no backend column — local UI state only. */
	seasonal: string;
	dashboardImageName: string;
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

/** Backend booleans -> the labels a checkbox group should show as checked. Pure. */
function checkedLabels(options: BooleanFieldOption[], farm: FarmDTO): string[] {
	return options.filter((option) => farm[option.field]).map((option) => option.label);
}

/**
 * Checked labels -> the boolean columns they drive. Every option in the group is
 * emitted (unchecked ones as false), so clearing a box actually persists. Pure.
 */
function booleansFor(
	options: BooleanFieldOption[],
	selected: string[]
): Record<FarmBooleanField, boolean> {
	return Object.fromEntries(
		options.map((option) => [option.field, selected.includes(option.label)])
	) as Record<FarmBooleanField, boolean>;
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

		description: farm.description ?? '',

		// counties_served[] / cities_served[] -> comma-separated text fields.
		counties: joinList(farm.counties_served),
		cities: joinList(farm.cities_served),
		homeCounty: farm.home_county ?? '',

		// food_categories[] is stored as the labels themselves.
		foodCategories: farm.food_categories ?? [],

		// Boolean columns -> checked labels in their themed groups.
		foodSafety: checkedLabels(FOOD_SAFETY_OPTIONS, farm),
		experiences: checkedLabels(EXPERIENCE_OPTIONS, farm),
		characteristics: checkedLabels(CHARACTERISTIC_OPTIONS, farm),
		schoolSales: checkedLabels(SCHOOL_SALES_OPTIONS, farm),

		// TODO(backend-mapping): no `growing_practices` column — local UI only.
		growingPractices: [],
		// TODO(backend-mapping): the seasonal products free-text field has no
		// backend column yet (`description` is a distinct, already-populated
		// field, so it is NOT a valid home for this). Left blank / not persisted
		// until a `seasonal_products` column exists.
		seasonal: '',
		// TODO(backend-mapping): dashboard image name comes from the file service
		// (StoredFile.original_file_name), not from FarmDTO; wired separately.
		dashboardImageName: ''
	};
}

/**
 * Build the UpdateFarmInput from the form model. Pure.
 *
 * Intentionally NOT sent (no backend column / no UI source):
 *   - growingPractices, seasonal: no `growing_practices` / `seasonal_products`
 *     column exists yet — sending them would be a no-op at best. Needs a
 *     migration before they can persist.
 *   - location (lat/lng), market_sales_data: no UI control for them here, and
 *     omitting them leaves the stored values untouched.
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
		description: m.description,
		farm_address: m.address,
		primary_phone: m.phone,
		primary_email: m.email,
		website: m.website,
		social_media,
		// Kept as two distinct arrays — both are used for farm filtering.
		counties_served: splitList(m.counties),
		cities_served: splitList(m.cities),
		home_county: m.homeCounty.trim(),
		food_categories: m.foodCategories,
		// Each checkbox group expands back into its boolean columns.
		...booleansFor(FOOD_SAFETY_OPTIONS, m.foodSafety),
		...booleansFor(EXPERIENCE_OPTIONS, m.experiences),
		...booleansFor(CHARACTERISTIC_OPTIONS, m.characteristics),
		...booleansFor(SCHOOL_SALES_OPTIONS, m.schoolSales)
	};
}
