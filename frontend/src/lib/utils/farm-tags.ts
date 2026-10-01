import type { FarmMarkerType, FarmTag, FoodCategorySection, MapFarm } from '$lib/types/farm';

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

export const FARM_TAG_ORDER: FarmTag[] = [
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
	return FARM_TAG_ORDER.filter((tag) => TAG_PREDICATES[tag]?.(farm as MapFarm) ?? false);
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
	section: FoodCategorySection;
	items: string[];
};

const FOOD_CATEGORY_ICONS: Record<FoodCategorySection, string> = {
	'Fruits and Vegetables': '/images/map/foodIcons/fruitIcon.svg',
	'Dairy and Eggs': '/images/map/foodIcons/dairyIcon.svg',
	Herbs: '/images/map/foodIcons/herbsIcon.svg',
	Meat: '/images/map/foodIcons/meatIcon.svg',
	Other: '/images/map/foodIcons/otherIcon.svg'
};

function splitDetail(detail: string | null | undefined): string[] {
	if (!detail?.trim()) return [];
	return detail
		.split(/[,;\n]/)
		.map((part) => part.trim())
		.filter(Boolean);
}

const SEASONAL_SECTIONS: FoodCategorySection[] = [
	'Fruits and Vegetables',
	'Dairy and Eggs',
	'Herbs'
];

export function getFarmProducts(farm: MapFarm): ProductRow[] {
	const rows: ProductRow[] = [];

	for (const section of SEASONAL_SECTIONS) {
		if (!farm.seasonal_products.includes(section)) continue;
		const detail = splitDetail(farm.seasonal_products_detail);
		rows.push({
			icon: FOOD_CATEGORY_ICONS[section],
			section,
			items: detail.length > 0 ? detail : [section]
		});
	}

	if (farm.meat_products.length > 0 && !farm.meat_products.includes('None of the above')) {
		const detail = splitDetail(farm.meat_products_detail);
		rows.push({
			icon: FOOD_CATEGORY_ICONS.Meat,
			section: 'Meat',
			items: detail.length > 0 ? detail : [...farm.meat_products]
		});
	}

	if (farm.other_products.length > 0 && !farm.other_products.includes('None of the above')) {
		const detail = splitDetail(farm.other_products_detail);
		rows.push({
			icon: FOOD_CATEGORY_ICONS.Other,
			section: 'Other',
			items: detail.length > 0 ? detail : [...farm.other_products]
		});
	}

	return rows;
}
