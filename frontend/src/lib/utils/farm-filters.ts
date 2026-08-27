// Filter model for the /farms map sidebar.
//
// Semantics: options within a group are OR'd, groups are AND'd together — a farm
// must match at least one selection in every group that has one.
import { MEAT_PRODUCTS, OTHER_PRODUCTS, SEASONAL_PRODUCTS } from '$lib/constants/farmOptions';
import type { FarmLocation, MapFarm } from '$lib/types/farm';
import { distanceInMiles } from '$lib/utils/distance';
import { FARM_TAG_ORDER, getFarmTags } from '$lib/utils/farm-tags';

export type FilterOption = {
	value: string;
	label: string;
};

export type FarmFilterState = {
	/** Radius in miles from the user's location; null means no distance filter. */
	distance: number | null;
	/** Matched against `farm_to_school_sales`. */
	institutions: string[];
	/** Encoded `${field}:${option}` values — see PRODUCT_OPTIONS. */
	products: string[];
	/** FarmTag values; kept as strings so the menu component stays generic. */
	tags: string[];
};

export const EMPTY_FARM_FILTERS: FarmFilterState = {
	distance: null,
	institutions: [],
	products: [],
	tags: []
};

export const DISTANCE_OPTIONS: FilterOption[] = [
	{ value: '10', label: 'Within 10 miles' },
	{ value: '25', label: 'Within 25 miles' },
	{ value: '50', label: 'Within 50 miles' },
	{ value: '100', label: 'Within 100 miles' }
];

/** The `farm_to_school_sales` entries that name an institution, not a logistics option. */
export const INSTITUTION_OPTIONS: FilterOption[] = [
	{ value: 'Interested in Selling to K-12 Schools', label: 'K-12 Schools' },
	{
		value: 'Interested in Selling to Early Care and Education Programs',
		label: 'Early Care & Education'
	}
];

type ProductField = 'seasonal_products' | 'meat_products' | 'other_products';

type ProductOption = FilterOption & {
	field: ProductField;
	option: string;
};

/** Both MEAT_PRODUCTS and OTHER_PRODUCTS contain "Other", so values are namespaced
 *  by field and the duplicated labels are disambiguated for the menu. */
function buildProductOptions(field: ProductField, options: string[], otherLabel: string) {
	return options.map((option) => ({
		field,
		option,
		value: `${field}:${option}`,
		label: option === 'Other' ? otherLabel : option
	}));
}

export const PRODUCT_OPTIONS: ProductOption[] = [
	...buildProductOptions('seasonal_products', SEASONAL_PRODUCTS, 'Other'),
	...buildProductOptions('meat_products', MEAT_PRODUCTS, 'Other Meat'),
	...buildProductOptions('other_products', OTHER_PRODUCTS, 'Other Products')
];

const PRODUCT_OPTION_BY_VALUE = new Map(PRODUCT_OPTIONS.map((option) => [option.value, option]));

export const TAG_OPTIONS: FilterOption[] = FARM_TAG_ORDER.map((tag) => ({
	value: tag,
	label: tag
}));

function includesAny(list: string[] | null | undefined, wanted: string[]): boolean {
	const values = list ?? [];
	return wanted.some((value) => values.includes(value));
}

function matchesProducts(farm: MapFarm, selected: string[]): boolean {
	return selected.some((value) => {
		const option = PRODUCT_OPTION_BY_VALUE.get(value);
		return option ? (farm[option.field] ?? []).includes(option.option) : false;
	});
}

/**
 * Apply the active filters to a farm list.
 *
 * `origin` is the user's location; when a distance filter is active but the
 * location is unknown (permission denied or still pending), no farm can be
 * placed within the radius, so the result is empty rather than unfiltered.
 */
export function filterFarms(
	farms: MapFarm[],
	filters: FarmFilterState,
	origin: FarmLocation | null
): MapFarm[] {
	return farms.filter((farm) => {
		if (filters.distance !== null) {
			if (!origin) return false;
			if (distanceInMiles(origin, farm.location) > filters.distance) return false;
		}

		if (
			filters.institutions.length > 0 &&
			!includesAny(farm.farm_to_school_sales, filters.institutions)
		) {
			return false;
		}

		if (filters.products.length > 0 && !matchesProducts(farm, filters.products)) {
			return false;
		}

		if (filters.tags.length > 0) {
			const tags: string[] = getFarmTags(farm);
			if (!filters.tags.some((tag) => tags.includes(tag))) return false;
		}

		return true;
	});
}

/** Total number of individual selections, for the "clear all" affordance. */
export function countActiveFilters(filters: FarmFilterState): number {
	return (
		(filters.distance === null ? 0 : 1) +
		filters.institutions.length +
		filters.products.length +
		filters.tags.length
	);
}
