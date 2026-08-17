import {
	FARM_CHARACTERISTICS,
	FARM_EXPERIENCES,
	FARM_TO_SCHOOL_SALES,
	FOOD_SAFETY_CERTIFICATIONS,
	GROWING_PRACTICES,
	NONE_OF_THE_ABOVE
} from '$lib/constants/farmOptions';

export const ADMIN_FARMS_PAGE_SIZE = 11;

/** Named slots into `farmOptions` — keep in sync with those array orderings. */
export const CSA_EXPERIENCE = FARM_EXPERIENCES[0];
export const [INTEREST_K12, INTEREST_ECE, ONLINE_SALES_OPTION, DELIVERY_OPTION] = FARM_TO_SCHOOL_SALES;
const AGRITOURISM_EXPERIENCES = FARM_EXPERIENCES.slice(1, 4); // U-Pick, Farm Stand, Farm Tours
const FARM_STAND = FARM_EXPERIENCES[2];

export const YES_NO_OPTIONS = ['Yes', 'No'] as const;

export type AdminFarmRow = {
	id: string;
	farm_name: string;
	primary_email: string;
	farm_address: string;
	primary_phone: string;
	growing_practices: string[];
	farm_characteristics: string[];
	food_safety_certifications: string[];
	farm_experiences: string[];
	farm_to_school_sales: string[];
	seasonal_products: string[];
	seasonal_products_detail: string | null;
	market_sales_data: { market: string; times: string }[] | null;
	f2s_experience: string | null;
	status: string;
	is_archived: boolean;
};

export const ADMIN_FARMS_QUERY = `
	query AdminFarms {
		farms(filter: { status: APPROVED, is_archived: false }) {
			id
			farm_name
			primary_email
			farm_address
			primary_phone
			growing_practices
			farm_characteristics
			food_safety_certifications
			farm_experiences
			farm_to_school_sales
			seasonal_products
			seasonal_products_detail
			market_sales_data {
				market
				times
			}
			f2s_experience
			status
			is_archived
		}
	}
`;

export const FARM_DETAILS_QUERY = `
	query FarmDetails($id: ID!) {
		farmById(id: $id) {
			id
			owner_user_id
			farm_name
			farm_address
			county
			primary_email
			primary_phone
			website
			social_media
			cities_served
			seasonal_products
			meat_products
			other_products
			seasonal_products_detail
			meat_products_detail
			other_products_detail
			growing_practices
			food_safety_certifications
			farm_experiences
			farm_characteristics
			farm_to_school_sales
			market_sales_data {
				market
				times
			}
			f2s_experience
			delivery_details
			minimum_order
			cover_photo
			carousel_photos
			status
			was_previously_rejected
			createdAt
			updatedAt
			owner {
				id
				firstName
				lastName
				email
				phone
			}
		}
	}
`;

export type SortableColumn = 'farm_name' | 'primary_email' | 'farm_address' | 'primary_phone';

export type FilterableColumn =
	| 'growing_practices'
	| 'farm_characteristics'
	| 'food_safety_certifications'
	| 'csa_boxes'
	| 'online_sales'
	| 'delivery'
	| 'interest';

export type FarmColumnFilters = Record<FilterableColumn, string[]>;

export type SortState = { column: SortableColumn; direction: 'asc' | 'desc' } | null;

export const EMPTY_FILTERS: FarmColumnFilters = {
	growing_practices: [],
	farm_characteristics: [],
	food_safety_certifications: [],
	csa_boxes: [],
	online_sales: [],
	delivery: [],
	interest: []
};

export const FILTER_OPTIONS: Record<FilterableColumn, readonly string[]> = {
	growing_practices: GROWING_PRACTICES,
	farm_characteristics: FARM_CHARACTERISTICS,
	food_safety_certifications: FOOD_SAFETY_CERTIFICATIONS,
	csa_boxes: YES_NO_OPTIONS,
	online_sales: YES_NO_OPTIONS,
	delivery: YES_NO_OPTIONS,
	interest: [INTEREST_K12, INTEREST_ECE]
};

export const FILTER_LABELS: Record<FilterableColumn, string> = {
	growing_practices: 'Growing Practices',
	farm_characteristics: 'Characteristics',
	food_safety_certifications: 'Certifications',
	csa_boxes: 'CSA Boxes',
	online_sales: 'Online Sales',
	delivery: 'Delivery',
	interest: 'Interest'
};

export function hasOption(list: string[] | null | undefined, value: string): boolean {
	return (list ?? []).includes(value);
}

export function yesNoLabel(value: boolean): 'Yes' | 'No' {
	return value ? 'Yes' : 'No';
}

export function shortCharacteristic(label: string): string {
	return label
		.replace(/ Farm$/, '')
		.replace(/^Beginning Farmer \(.*\)$/, 'Beginning Farmer')
		.replace(/^Young Farmer \(.*\)$/, 'Young Farmer');
}

export function formatInterest(sales: string[]): string {
	const k12 = hasOption(sales, INTEREST_K12);
	const ece = hasOption(sales, INTEREST_ECE);
	if (k12 && ece) return 'Schools & ECE';
	if (k12) return 'K-12 Schools';
	if (ece) return 'ECE Programs';
	return '—';
}

export function formatSeasonalProduce(farm: AdminFarmRow): string {
	const detail = farm.seasonal_products_detail?.trim();
	if (detail) return detail;
	const products = farm.seasonal_products.filter((p) => p !== NONE_OF_THE_ABOVE);
	return products.length ? products.join(', ') : '—';
}

export function formatAgritourism(farm: AdminFarmRow): string {
	const agritourism = AGRITOURISM_EXPERIENCES.filter((opt) =>
		hasOption(farm.farm_experiences, opt)
	);
	return agritourism.length ? agritourism.join(', ') : '—';
}

export function formatFarmersMarkets(farm: AdminFarmRow): string {
	const markets = (farm.market_sales_data ?? []).map((m) => m.market).filter(Boolean);
	if (markets.length) return markets.join(', ');
	if (hasOption(farm.farm_experiences, FARM_STAND)) return FARM_STAND;
	return '—';
}

export function formatExperience(farm: AdminFarmRow): string {
	return farm.f2s_experience?.trim() || '—';
}

export function farmMatchesSearch(farm: AdminFarmRow, search: string): boolean {
	const q = search.trim().toLowerCase();
	if (!q) return true;
	return [
		farm.farm_name,
		farm.primary_email,
		farm.farm_address,
		farm.primary_phone,
		...farm.growing_practices,
		...farm.farm_characteristics,
		...farm.food_safety_certifications
	]
		.join(' ')
		.toLowerCase()
		.includes(q);
}

function matchesYesNoFilter(selected: string[], value: boolean): boolean {
	if (!selected.length) return true;
	const label = yesNoLabel(value);
	return selected.includes(label);
}

function matchesMultiFilter(selected: string[], values: string[]): boolean {
	if (!selected.length) return true;
	return selected.some((s) => values.includes(s));
}

export function farmMatchesFilters(farm: AdminFarmRow, filters: FarmColumnFilters): boolean {
	if (!matchesMultiFilter(filters.growing_practices, farm.growing_practices)) return false;
	if (!matchesMultiFilter(filters.farm_characteristics, farm.farm_characteristics)) return false;
	if (!matchesMultiFilter(filters.food_safety_certifications, farm.food_safety_certifications)) {
		return false;
	}
	if (!matchesYesNoFilter(filters.csa_boxes, hasOption(farm.farm_experiences, CSA_EXPERIENCE))) {
		return false;
	}
	if (
		!matchesYesNoFilter(filters.online_sales, hasOption(farm.farm_to_school_sales, ONLINE_SALES_OPTION))
	) {
		return false;
	}
	if (!matchesYesNoFilter(filters.delivery, hasOption(farm.farm_to_school_sales, DELIVERY_OPTION))) {
		return false;
	}
	if (!matchesMultiFilter(filters.interest, farm.farm_to_school_sales)) return false;
	return true;
}

export function sortFarms(farms: AdminFarmRow[], sort: SortState): AdminFarmRow[] {
	if (!sort) return farms;
	const { column, direction } = sort;
	const dir = direction === 'asc' ? 1 : -1;
	return farms.toSorted((a, b) => a[column].localeCompare(b[column], undefined, { sensitivity: 'base' }) * dir);
}

export function visiblePageNumbers(current: number, total: number): number[] {
	if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
	const start = Math.max(1, Math.min(current - 2, total - 4));
	return Array.from({ length: 5 }, (_, i) => start + i);
}

/** Display labels for Interest filter checkboxes (shorter than stored values). */
export function interestFilterLabel(option: string): string {
	if (option === INTEREST_K12) return 'K-12 Schools';
	if (option === INTEREST_ECE) return 'ECE Programs';
	return option;
}

export function characteristicFilterLabel(option: string): string {
	return shortCharacteristic(option);
}
