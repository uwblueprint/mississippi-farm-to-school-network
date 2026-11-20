import type { FarmMarkerType, FarmTag, MapFarm } from '$lib/types/farm';
import { decodeCategoryDetails, expandProductCategories } from '$lib/utils/product-details';

const TAG_COLOR_CLASS: Partial<Record<FarmTag, string>> = {
	Processing: 'blue',
	'Pickup Location': 'pink',
	'CSA Farm': 'purple',
	'Field Trips': 'tan'
};

export function getTagColor(tag: FarmTag): string {
	return TAG_COLOR_CLASS[tag] ?? 'gray';
}

function hasOption(list: string[] | null | undefined, value: string): boolean {
	return (list ?? []).includes(value);
}

const TAG_PREDICATES: Partial<Record<FarmTag, (farm: MapFarm) => boolean>> = {
	Processing: (farm) =>
		hasOption(farm.food_safety_certifications, 'GAP Certified') ||
		hasOption(farm.food_safety_certifications, 'Food Safety Plan in Place'),
	'Pickup Location': (farm) => hasOption(farm.farm_to_school_sales, 'Delivery Available'),
	'CSA Farm': (farm) =>
		hasOption(farm.farm_experiences, 'CSA (Community Supported Agriculture) Available'),
	'Farmers Market': (farm) =>
		hasOption(farm.farm_experiences, 'Farm Stand On-Site') ||
		(farm.market_sales_data?.length ?? 0) > 0,
	'Field Trips': (farm) => hasOption(farm.farm_experiences, 'Farm Tours/Field Trips Welcome')
};

const TAG_ORDER: FarmTag[] = [
	'Processing',
	'Pickup Location',
	'CSA Farm',
	'Farmers Market',
	'Field Trips'
];

export function getFarmTags(
	farm: Pick<
		MapFarm,
		'food_safety_certifications' | 'farm_to_school_sales' | 'farm_experiences' | 'market_sales_data'
	>
): FarmTag[] {
	// Every listed tag has an explicit predicate; default to excluding any tag
	// that doesn't (safer than silently showing an unimplemented tag on every farm).
	return TAG_ORDER.filter((tag) => TAG_PREDICATES[tag]?.(farm as MapFarm) ?? false);
}

/** Derive map marker type from FarmDTO option arrays. */
export function getMarkerType(
	farm: Pick<
		MapFarm,
		'farm_experiences' | 'farm_to_school_sales' | 'food_safety_certifications' | 'market_sales_data'
	>
): FarmMarkerType {
	if (hasOption(farm.farm_experiences, 'CSA (Community Supported Agriculture) Available')) {
		return 'csa';
	}
	if (hasOption(farm.farm_to_school_sales, 'Delivery Available')) {
		return 'pickup';
	}
	if (
		hasOption(farm.farm_experiences, 'Farm Stand On-Site') ||
		(farm.market_sales_data?.length ?? 0) > 0
	) {
		return 'market';
	}
	if (hasOption(farm.food_safety_certifications, 'GAP Certified')) {
		return 'processing';
	}
	return 'farm';
}

export type ProductRow = {
	icon: string;
	section: string;
	items: string[];
};

const PRODUCT_ICONS: Record<string, string> = {
	Fruits: '/images/map/foodIcons/fruitIcon.svg',
	Vegetables: '/images/map/foodIcons/vegetableIcon.svg',
	Dairy: '/images/map/foodIcons/dairyIcon.svg',
	Eggs: '/images/map/foodIcons/eggIcon.svg',
	Herbs: '/images/map/foodIcons/herbsIcon.svg',
	Beef: '/images/map/foodIcons/meatIcon.svg',
	Poultry: '/images/map/foodIcons/meatIcon.svg',
	Fish: '/images/map/foodIcons/meatIcon.svg',
	Honey: '/images/map/foodIcons/otherIcon.svg',
	Mushrooms: '/images/map/foodIcons/otherIcon.svg',
	Flowers: '/images/map/foodIcons/otherIcon.svg',
	'Seedlings & Plants': '/images/map/foodIcons/otherIcon.svg',
	Grains: '/images/map/foodIcons/otherIcon.svg',
	'Value-Added Products': '/images/map/foodIcons/otherIcon.svg',
	Other: '/images/map/foodIcons/otherIcon.svg'
};

function productRows(
	categories: string[] | null | undefined,
	detail: string | null | undefined,
	iconFor: (category: string) => string
): ProductRow[] {
	const selected = expandProductCategories(categories);
	const notes = decodeCategoryDetails(detail, selected);
	return selected.map((section) => ({
		icon: iconFor(section),
		section,
		items: [notes[section]?.trim() || section]
	}));
}

export function getFarmProducts(farm: MapFarm): ProductRow[] {
	const iconFor = (otherIcon: string) => (section: string) =>
		section === 'Other' ? otherIcon : (PRODUCT_ICONS[section] ?? otherIcon);
	return [
		...productRows(
			farm.seasonal_products,
			farm.seasonal_products_detail,
			iconFor(PRODUCT_ICONS.Other)
		),
		...productRows(
			farm.meat_products,
			farm.meat_products_detail,
			iconFor(PRODUCT_ICONS.Beef)
		),
		...productRows(
			farm.other_products,
			farm.other_products_detail,
			iconFor(PRODUCT_ICONS.Other)
		)
	];
}
