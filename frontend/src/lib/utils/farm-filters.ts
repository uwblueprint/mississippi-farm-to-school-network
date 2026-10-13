import { INTEREST_ECE, INTEREST_K12 } from '$lib/utils/admin-farms';
import { distanceInMiles } from '$lib/utils/distance';
import { getFarmProducts, getFarmTags } from '$lib/utils/farm-tags';
import type { FarmLocation, FarmTag, FoodCategorySection, MapFarm } from '$lib/types/farm';

export type FarmFilters = {
	maxDistance: number | null;
	institutionTypes: string[];
	products: FoodCategorySection[];
	tags: FarmTag[];
};

export type FarmSortKey = 'name-asc' | 'name-desc' | 'distance';

export type FilterOption<T extends string | number = string> = { value: T; label: string };

export const EMPTY_FARM_FILTERS: FarmFilters = {
	maxDistance: null,
	institutionTypes: [],
	products: [],
	tags: []
};

export const DISTANCE_OPTIONS: FilterOption<number>[] = [10, 25, 50, 100].map((miles) => ({
	value: miles,
	label: `Within ${miles} miles`
}));

export const INSTITUTION_TYPE_OPTIONS: FilterOption[] = [
	{ value: INTEREST_K12, label: 'K-12 Schools' },
	{ value: INTEREST_ECE, label: 'Early Care and Education' }
];

export const PRODUCT_OPTIONS: FilterOption<FoodCategorySection>[] = [
	{ value: 'Fruits and Vegetables', label: 'Fruits and Vegetables' },
	{ value: 'Dairy and Eggs', label: 'Dairy and Eggs' },
	{ value: 'Herbs', label: 'Herbs' },
	{ value: 'Meat', label: 'Meat' },
	{ value: 'Other', label: 'Other Products' }
];

export const TAG_OPTIONS: FilterOption<FarmTag>[] = (
	['Processing', 'Pickup Location', 'CSA Farm', 'Farmers Market', 'Field Trips'] as FarmTag[]
).map((tag) => ({ value: tag, label: tag }));

export function hasActiveFilters(filters: FarmFilters): boolean {
	return (
		filters.maxDistance !== null ||
		filters.institutionTypes.length > 0 ||
		filters.products.length > 0 ||
		filters.tags.length > 0
	);
}

function matchesAny<T>(selected: T[], farmValues: T[]): boolean {
	return selected.length === 0 || selected.some((value) => farmValues.includes(value));
}

export function filterFarms(
	farms: MapFarm[],
	filters: FarmFilters,
	userCoords: FarmLocation | null
): MapFarm[] {
	return farms.filter((farm) => {
		if (
			filters.maxDistance !== null &&
			userCoords &&
			distanceInMiles(userCoords, farm.location) > filters.maxDistance
		) {
			return false;
		}

		return (
			matchesAny(filters.institutionTypes, farm.farm_to_school_sales ?? []) &&
			matchesAny(
				filters.products,
				getFarmProducts(farm).map((row) => row.section)
			) &&
			matchesAny(filters.tags, getFarmTags(farm))
		);
	});
}

const byName = (a: MapFarm, b: MapFarm) =>
	a.farm_name.localeCompare(b.farm_name, undefined, { sensitivity: 'base' });

export function sortFarms(
	farms: MapFarm[],
	sortKey: FarmSortKey | null,
	userCoords: FarmLocation | null
): MapFarm[] {
	const sorted = [...farms];

	switch (sortKey) {
		case 'name-asc':
			return sorted.sort(byName);
		case 'name-desc':
			return sorted.sort((a, b) => byName(b, a));
		case 'distance':
			if (!userCoords) return sorted.sort(byName);
			return sorted.sort(
				(a, b) => distanceInMiles(userCoords, a.location) - distanceInMiles(userCoords, b.location)
			);
		default:
			return sorted;
	}
}
