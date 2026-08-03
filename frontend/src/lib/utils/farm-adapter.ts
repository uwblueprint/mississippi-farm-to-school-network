import type {
	FarmFoodCategoryItems,
	FarmMarkerType,
	FarmStatus,
	MapFarm
} from '$lib/types/farm';

/** Subset of FarmDTO fields returned by `/api/farms`. */
export type FarmDto = {
	id: string;
	owner_user_id: string;
	usda_farm_id: string | null;
	farm_name: string;
	primary_phone: string;
	primary_email: string;
	website: string | null;
	social_media: Record<string, unknown> | null;
	farm_address: string;
	county: string;
	cities_served: string[] | null;
	location: { lat: number; lng: number };
	seasonal_products: string[];
	meat_products: string[];
	other_products: string[];
	seasonal_products_detail: string | null;
	meat_products_detail: string | null;
	other_products_detail: string | null;
	growing_practices: string[];
	food_safety_certifications: string[];
	farm_experiences: string[];
	farm_characteristics: string[];
	farm_to_school_sales: string[];
	market_sales_data: { market: string; times: string }[] | null;
	f2s_experience: string | null;
	delivery_details: string | null;
	cover_photo: string | null;
	carousel_photos: string[];
	status: FarmStatus;
	createdAt: string;
	updatedAt: string;
};

const PLACEHOLDER_IMAGES = [
	'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=900&q=80',
	'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
	'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80'
];

function includes(list: string[] | null | undefined, value: string): boolean {
	return (list ?? []).includes(value);
}

function splitDetail(detail: string | null | undefined): string[] {
	if (!detail?.trim()) return [];
	return detail
		.split(/[,;\n]/)
		.map((part) => part.trim())
		.filter(Boolean);
}

function buildFoodCategoryItems(dto: FarmDto): FarmFoodCategoryItems {
	const items: FarmFoodCategoryItems = {};

	for (const section of dto.seasonal_products) {
		if (section === 'None of the above') continue;
		const detail = splitDetail(dto.seasonal_products_detail);
		items[section as keyof FarmFoodCategoryItems] =
			detail.length > 0 ? detail : [section];
	}

	if (dto.meat_products.length > 0 && !dto.meat_products.includes('None of the above')) {
		const detail = splitDetail(dto.meat_products_detail);
		items.Meat = detail.length > 0 ? detail : [...dto.meat_products];
	}

	if (dto.other_products.length > 0 && !dto.other_products.includes('None of the above')) {
		const detail = splitDetail(dto.other_products_detail);
		items.Other = detail.length > 0 ? detail : [...dto.other_products];
	}

	return items;
}

function markerTypeForFarm(
	farm: Pick<MapFarm, 'csa_boxes' | 'delivery' | 'sells_at_markets' | 'gap_certified'>
): FarmMarkerType {
	if (farm.csa_boxes) return 'csa';
	if (farm.delivery) return 'pickup';
	if (farm.sells_at_markets) return 'market';
	if (farm.gap_certified) return 'processing';
	return 'farm';
}

function placeholderImages(id: string): string[] {
	const index = Number.parseInt(id.replace(/\D/g, '').slice(0, 6), 10) || 0;
	return [
		PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
		PLACEHOLDER_IMAGES[(index + 1) % PLACEHOLDER_IMAGES.length],
		PLACEHOLDER_IMAGES[(index + 2) % PLACEHOLDER_IMAGES.length]
	];
}

/**
 * Adapt live FarmDTO JSON into the MapFarm shape the map UI still expects.
 * Image URLs stay placeholders until Part E resolves cover/carousel IDs.
 */
export function farmDtoToMapFarm(dto: FarmDto): MapFarm {
	const food_category_items = buildFoodCategoryItems(dto);
	const food_categories = Object.keys(food_category_items);
	const imageUrls = placeholderImages(dto.id);

	const gap_certified = includes(dto.food_safety_certifications, 'GAP Certified');
	const food_safety_plan = includes(dto.food_safety_certifications, 'Food Safety Plan in Place');
	const csa_boxes = includes(
		dto.farm_experiences,
		'CSA (Community Supported Agriculture) Available'
	);
	const agritourism = includes(dto.farm_experiences, 'Farm Tours/Field Trips Welcome');
	const sells_at_markets =
		includes(dto.farm_experiences, 'Farm Stand On-Site') ||
		(dto.market_sales_data?.length ?? 0) > 0;
	const delivery = includes(dto.farm_to_school_sales, 'Delivery Available');
	const online_sales = includes(dto.farm_to_school_sales, 'Online Ordering Available');
	const bipoc_owned = includes(dto.farm_characteristics, 'BIPOC-Owned Farm');
	const interested_in_f2s =
		includes(dto.farm_to_school_sales, 'Interested in Selling to K-12 Schools') ||
		includes(
			dto.farm_to_school_sales,
			'Interested in Selling to Early Care and Education Programs'
		);
	const f2s_experience = Boolean(dto.f2s_experience?.trim());

	const usdaParsed = dto.usda_farm_id ? Number.parseInt(dto.usda_farm_id, 10) : NaN;

	const partial = {
		gap_certified,
		food_safety_plan,
		csa_boxes,
		agritourism,
		sells_at_markets,
		delivery,
		online_sales
	};

	return {
		id: dto.id,
		owner_user_id: dto.owner_user_id,
		usda_farm_id: Number.isFinite(usdaParsed) ? usdaParsed : 0,
		farm_name: dto.farm_name,
		description: food_categories.length > 0 ? food_categories.join(' · ') : dto.farm_address,
		primary_phone: dto.primary_phone,
		primary_email: dto.primary_email,
		website: dto.website,
		social_media: dto.social_media,
		farm_address: dto.farm_address,
		counties_served: [dto.county],
		cities_served: dto.cities_served ?? [],
		home_county: dto.county,
		location: dto.location,
		food_categories,
		food_category_items,
		market_sales_data: dto.market_sales_data,
		bipoc_owned,
		...partial,
		f2s_experience,
		interested_in_f2s,
		status: dto.status,
		markerType: markerTypeForFarm(partial),
		imageUrls,
		thumbnailUrl: imageUrls[0],
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
