import type { FarmTag, FoodCategorySection, MapFarm } from '$lib/types/farm';

const TAG_COLOR_CLASS: Partial<Record<FarmTag, string>> = {
	Processing: 'blue',
	'Pickup Location': 'pink',
	'CSA Farm': 'purple',
	'Mississippi Farm': 'green',
	'Field Trips': 'tan'
};

export function getTagColor(tag: FarmTag): string {
	return TAG_COLOR_CLASS[tag] ?? 'gray';
}

const TAG_PREDICATES: Partial<Record<FarmTag, (farm: MapFarm) => boolean>> = {
	Processing: (farm) => farm.gap_certified || farm.food_safety_plan,
	'Pickup Location': (farm) => farm.delivery,
	'CSA Farm': (farm) => farm.csa_boxes,
	'Farmers Market': (farm) => farm.sells_at_markets,
	'Field Trips': (farm) => farm.agritourism
};

const TAG_ORDER: FarmTag[] = [
	'Mississippi Farm',
	'Processing',
	'Pickup Location',
	'CSA Farm',
	'Farmers Market',
	'Field Trips'
];

export function getFarmTags(farm: MapFarm): FarmTag[] {
	return TAG_ORDER.filter((tag) => TAG_PREDICATES[tag]?.(farm) ?? true);
}

export type ProductRow = {
	icon: string;
	section: FoodCategorySection;
	items: string[];
};

const FOOD_CATEGORY_SECTIONS: FoodCategorySection[] = [
	'Fruits and Vegetables',
	'Dairy and Eggs',
	'Herbs',
	'Meat',
	'Other'
];

const FOOD_CATEGORY_ICONS: Record<FoodCategorySection, string> = {
	'Fruits and Vegetables': '/images/map/foodIcons/fruitIcon.svg',
	'Dairy and Eggs': '/images/map/foodIcons/dairyIcon.svg',
	Herbs: '/images/map/foodIcons/herbsIcon.svg',
	Meat: '/images/map/foodIcons/meatIcon.svg',
	Other: '/images/map/foodIcons/otherIcon.svg'
};

export function getFarmProducts(farm: MapFarm): ProductRow[] {
	return FOOD_CATEGORY_SECTIONS.flatMap((section) => {
		const items = farm.food_category_items[section];
		if (!items || items.length === 0) return [];
		return [{ icon: FOOD_CATEGORY_ICONS[section], section, items }];
	});
}
