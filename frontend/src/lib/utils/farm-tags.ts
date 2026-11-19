import type { FarmMarkerType, FarmTag, FoodCategorySection, MapFarm } from '$lib/types/farm';

const CSA_EXPERIENCE = 'CSA (Community Supported Agriculture) Available';

const TAG_COLOR_CLASS: Partial<Record<FarmTag, string>> = {
	Processing: 'blue',
	'CSA Pickup Location': 'pink',
	'CSA Available': 'purple',
	'Field Trips': 'tan'
};

export function getTagColor(tag: FarmTag): string {
	return TAG_COLOR_CLASS[tag] ?? 'gray';
}

function hasOption(list: string[] | null | undefined, value: string): boolean {
	return (list ?? []).includes(value);
}

function filled(value: string | null | undefined): boolean {
	return Boolean(value?.trim());
}

const TAG_PREDICATES: Partial<Record<FarmTag, (farm: MapFarm) => boolean>> = {
	Processing: (farm) =>
		filled(farm.processing_abilities) && farm.processing_abilities!.trim().toLowerCase() !== 'no',
	'CSA Pickup Location': (farm) => filled(farm.csa_pickup_spots),
	'CSA Available': (farm) => hasOption(farm.farm_experiences, CSA_EXPERIENCE),
	'Farmers Market': (farm) =>
		hasOption(farm.farm_experiences, 'Farm Stand On-Site') ||
		(farm.market_sales_data?.length ?? 0) > 0,
	'Field Trips': (farm) => hasOption(farm.farm_experiences, 'Farm Tours/Field Trips Welcome')
};

const TAG_ORDER: FarmTag[] = [
	'Processing',
	'CSA Pickup Location',
	'CSA Available',
	'Farmers Market',
	'Field Trips'
];

export function getFarmTags(
	farm: Pick<
		MapFarm,
		'farm_experiences' | 'market_sales_data' | 'csa_pickup_spots' | 'processing_abilities'
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
		'farm_experiences' | 'market_sales_data' | 'csa_pickup_spots' | 'processing_abilities'
	>
): FarmMarkerType {
	if (hasOption(farm.farm_experiences, CSA_EXPERIENCE)) {
		return 'csa';
	}
	if (filled(farm.csa_pickup_spots)) {
		return 'pickup';
	}
	if (
		hasOption(farm.farm_experiences, 'Farm Stand On-Site') ||
		(farm.market_sales_data?.length ?? 0) > 0
	) {
		return 'market';
	}
	if (TAG_PREDICATES.Processing?.(farm as MapFarm)) {
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
