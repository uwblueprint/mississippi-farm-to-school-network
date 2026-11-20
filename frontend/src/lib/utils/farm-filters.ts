import { MEAT_PRODUCTS, OTHER_PRODUCTS, SEASONAL_PRODUCTS } from '$lib/constants/farmOptions';
import { INTEREST_ECE, INTEREST_K12 } from '$lib/utils/admin-farms';
import type { GeolocationStatus } from '$lib/state/geolocation.svelte';
import { distanceInMiles } from '$lib/utils/distance';
import { getFarmProducts, getFarmTags } from '$lib/utils/farm-tags';
import type { FarmLocation, FarmTag, MapFarm } from '$lib/types/farm';

export type FarmFilters = {
	maxDistance: number | null;
	/** Activity tags. Shown under the Institution Type menu. */
	institutionTypes: FarmTag[];
	products: string[];
	/** School and early-care interests. Shown under the Tags menu. */
	tags: string[];
};

export type FarmSortKey = 'name-asc' | 'name-desc' | 'distance';

export type FilterOption<T extends string | number = string> = { value: T; label: string };

export function emptyFarmFilters(): FarmFilters {
	return {
		maxDistance: null,
		institutionTypes: [],
		products: [],
		tags: []
	};
}

/** Stable empty filters object for spreads in mobile clear-all. */
export const EMPTY_FARM_FILTERS: FarmFilters = emptyFarmFilters();

export const DISTANCE_OPTIONS: FilterOption<number>[] = [10, 25, 50, 100].map((miles) => ({
	value: miles,
	label: `Within ${miles} miles`
}));

const ACTIVITY_TAGS: FarmTag[] = [
	'Processing',
	'Pickup Location',
	'CSA Farm',
	'Farmers Market',
	'Field Trips'
];

/** Institution Type opens the activity tags. Tags opens school and ECE interest. */
export const INSTITUTION_TYPE_OPTIONS: FilterOption<FarmTag>[] = ACTIVITY_TAGS.map((tag) => ({
	value: tag,
	label: tag
}));

export const TAG_OPTIONS: FilterOption[] = [
	{ value: INTEREST_K12, label: 'K-12 Schools' },
	{ value: INTEREST_ECE, label: 'Early Care and Education' }
];

const PRODUCT_LABELS = [
	...SEASONAL_PRODUCTS,
	...MEAT_PRODUCTS.filter((product) => product !== 'Other'),
	...OTHER_PRODUCTS
];

export const PRODUCT_OPTIONS: FilterOption[] = PRODUCT_LABELS.map((product) => ({
	value: product,
	label: product === 'Other' ? 'Other Products' : product
}));

export const SORT_OPTIONS: FilterOption<FarmSortKey>[] = [
	{ value: 'distance', label: 'Distance' },
	{ value: 'name-asc', label: 'Name (A–Z)' },
	{ value: 'name-desc', label: 'Name (Z–A)' }
];

export function getLocationNote(status: GeolocationStatus): string | undefined {
	switch (status) {
		case 'granted':
			return undefined;
		case 'denied':
			return 'Allow location access in your browser to filter and sort by distance.';
		case 'unavailable':
			return "Your browser doesn't support location, so distance can't be used.";
		default:
			return 'Waiting for your location…';
	}
}

export function toggleSelection<T>(selected: T[], value: T, multiple: boolean): T[] {
	if (selected.includes(value)) return selected.filter((item) => item !== value);
	return multiple ? [...selected, value] : [value];
}

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
			matchesAny(filters.institutionTypes, getFarmTags(farm)) &&
			matchesAny(
				filters.products,
				getFarmProducts(farm).map((row) => row.section)
			) &&
			matchesAny(filters.tags, farm.farm_to_school_sales ?? [])
		);
	});
}

const byName = (a: MapFarm, b: MapFarm) =>
	a.farm_name.localeCompare(b.farm_name, undefined, { sensitivity: 'base' });

function milesFrom(userCoords: FarmLocation, farm: MapFarm): number {
	const location = farm.location;
	if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
		return Number.POSITIVE_INFINITY;
	}
	return distanceInMiles(userCoords, location);
}

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
			return sorted.sort((a, b) => milesFrom(userCoords, a) - milesFrom(userCoords, b));
		default:
			return sorted;
	}
}
