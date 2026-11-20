import {
	FARM_CHARACTERISTICS,
	FARM_EXPERIENCES,
	FARM_TO_SCHOOL_SALES,
	FOOD_SAFETY_CERTIFICATIONS,
	GROWING_PRACTICES
} from '$lib/constants/farmOptions';
import { decodeCategoryDetails, expandProductCategories } from '$lib/utils/product-details';

export const ADMIN_FARMS_PAGE_SIZE = 11;

/** Page size for fetching farms from the API (the resolver caps pageSize at 100). */
export const ADMIN_FARMS_FETCH_PAGE_SIZE = 100;

/** Named slots into `farmOptions` — keep in sync with those array orderings. */
export const CSA_EXPERIENCE = FARM_EXPERIENCES[0];
export const [INTEREST_K12, INTEREST_ECE, ONLINE_SALES_OPTION, DELIVERY_OPTION] =
	FARM_TO_SCHOOL_SALES;
const FARM_STAND = FARM_EXPERIENCES[2];

export const YES_NO_OPTIONS = ['Yes', 'No'] as const;

export type AdminFarmRow = {
	id: string;
	farm_name: string;
	about_us: string | null;
	primary_contact_name: string | null;
	primary_email: string;
	primary_phone: string;
	website: string | null;
	social_media: Record<string, unknown> | null;
	farm_address: string;
	county: string | null;
	usda_farm_id: string | null;
	cities_served: string[];
	growing_practices: string[];
	growing_practices_other: string | null;
	farm_characteristics: string[];
	food_safety_certifications: string[];
	food_safety_other: string | null;
	farm_experiences: string[];
	farm_to_school_sales: string[];
	seasonal_products: string[];
	seasonal_products_detail: string | null;
	meat_products: string[];
	meat_products_detail: string | null;
	other_products: string[];
	other_products_detail: string | null;
	market_sales_data: { market: string; times: string }[] | null;
	farmers_markets: string | null;
	minimum_order: string | null;
	f2s_experience: string | null;
	delivery_details: string | null;
	status: string;
	is_archived: boolean;
};

export const ADMIN_FARMS_QUERY = `
	query AdminFarms($pageNumber: Int!, $pageSize: Int!) {
		farms(
			filter: { status: APPROVED, is_archived: false }
			pageNumber: $pageNumber
			pageSize: $pageSize
		) {
			id
			farm_name
			about_us
			primary_contact_name
			primary_email
			primary_phone
			website
			social_media
			farm_address
			county
			usda_farm_id
			cities_served
			growing_practices
			growing_practices_other
			farm_characteristics
			food_safety_certifications
			food_safety_other
			farm_experiences
			farm_to_school_sales
			seasonal_products
			seasonal_products_detail
			meat_products
			meat_products_detail
			other_products
			other_products_detail
			market_sales_data {
				market
				times
			}
			farmers_markets
			minimum_order
			f2s_experience
			delivery_details
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
			about_us
			primary_contact_name
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
			growing_practices_other
			food_safety_certifications
			food_safety_other
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
			farmers_markets
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
	farm_characteristics: 'Farm Characteristics',
	food_safety_certifications: 'Food Safety & Certifications',
	csa_boxes: 'CSA Available',
	online_sales: 'Online Ordering Available',
	delivery: 'Delivery Available',
	interest: 'Interest in Selling to Schools'
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
	const parts: string[] = [];
	if (hasOption(sales, INTEREST_K12)) parts.push('K-12 Schools');
	if (hasOption(sales, INTEREST_ECE)) parts.push('Early Care and Education');
	return parts.join(', ');
}

export function withOtherAnswer(values: string[], other: string | null | undefined): string[] {
	const extra = other?.trim();
	if (!extra) return values;
	return values.map((value) => (value === 'Other' ? `Other: ${extra}` : value));
}

export function formatFarmersMarkets(farm: AdminFarmRow): string {
	const filled = farm.farmers_markets?.trim();
	if (filled) return filled;
	const markets = (farm.market_sales_data ?? []).map((m) => m.market).filter(Boolean);
	if (markets.length) return markets.join(', ');
	if (hasOption(farm.farm_experiences, FARM_STAND)) return FARM_STAND;
	return '';
}

export type ProductLine = { category: string; detail: string; unlabeled?: boolean };

export function productLines(
	categories: string[] | null | undefined,
	detail: string | null | undefined
): ProductLine[] {
	const selected = expandProductCategories(categories);
	const raw = detail?.trim() ?? '';
	const notes = decodeCategoryDetails(raw, selected);
	const labeled = raw.split('\n').some((line) => {
		const splitAt = line.indexOf(':');
		if (splitAt <= 0) return false;
		return selected.includes(line.slice(0, splitAt).trim());
	});

	const lines: ProductLine[] = selected.map((category) => ({
		category,
		detail: labeled ? (notes[category]?.trim() ?? '') : ''
	}));

	// A single unlabeled note belongs to that one category. A note shared across
	// several categories stays as its own line instead of being assigned to the first.
	if (!labeled && raw) {
		if (selected.length <= 1 && lines[0]) lines[0].detail = raw;
		else lines.unshift({ category: 'Details', detail: raw, unlabeled: true });
	}
	return lines;
}

export function formatProductLines(lines: ProductLine[]): string {
	const unlabeled = lines.find((line) => line.unlabeled);
	const named = lines
		.filter((line) => !line.unlabeled)
		.map((line) => (line.detail ? `${line.category}: ${line.detail}` : line.category));
	if (unlabeled?.detail) named.push(`Details: ${unlabeled.detail}`);
	return named.join('; ');
}

export function socialText(farm: AdminFarmRow, key: string): string {
	const raw = farm.social_media;
	if (!raw || typeof raw !== 'object') return '';
	const value = raw[key];
	return typeof value === 'string' ? value.trim() : '';
}

export function plain(value: string | null | undefined): string {
	return value?.trim() ?? '';
}

export function joinList(values: string[] | null | undefined): string {
	return (values ?? [])
		.map((value) => value.trim())
		.filter(Boolean)
		.join('; ');
}

export function farmMatchesSearch(farm: AdminFarmRow, search: string): boolean {
	const q = search.trim().toLowerCase();
	if (!q) return true;
	return [
		farm.farm_name,
		farm.about_us,
		farm.primary_contact_name,
		farm.primary_email,
		farm.primary_phone,
		farm.website,
		farm.farm_address,
		farm.county,
		farm.usda_farm_id,
		...(farm.cities_served ?? []),
		...farm.growing_practices,
		farm.growing_practices_other,
		...farm.farm_characteristics,
		...farm.food_safety_certifications,
		farm.food_safety_other,
		farm.farmers_markets,
		farm.minimum_order,
		farm.f2s_experience,
		farm.delivery_details,
		...farm.farm_experiences,
		...farm.seasonal_products,
		farm.seasonal_products_detail,
		...farm.meat_products,
		farm.meat_products_detail,
		...farm.other_products,
		farm.other_products_detail
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
		!matchesYesNoFilter(
			filters.online_sales,
			hasOption(farm.farm_to_school_sales, ONLINE_SALES_OPTION)
		)
	) {
		return false;
	}
	if (
		!matchesYesNoFilter(filters.delivery, hasOption(farm.farm_to_school_sales, DELIVERY_OPTION))
	) {
		return false;
	}
	if (!matchesMultiFilter(filters.interest, farm.farm_to_school_sales)) return false;
	return true;
}

export function sortFarms(farms: AdminFarmRow[], sort: SortState): AdminFarmRow[] {
	if (!sort) return farms;
	const { column, direction } = sort;
	const dir = direction === 'asc' ? 1 : -1;
	return farms.toSorted(
		(a, b) => a[column].localeCompare(b[column], undefined, { sensitivity: 'base' }) * dir
	);
}

export function visiblePageNumbers(current: number, total: number): number[] {
	if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
	const start = Math.max(1, Math.min(current - 2, total - 4));
	return Array.from({ length: 5 }, (_, i) => start + i);
}

/** Display labels for Interest filter checkboxes (shorter than stored values). */
export function interestFilterLabel(option: string): string {
	if (option === INTEREST_K12) return 'K-12 Schools';
	if (option === INTEREST_ECE) return 'Early Care and Education';
	return option;
}

export function characteristicFilterLabel(option: string): string {
	return shortCharacteristic(option);
}
