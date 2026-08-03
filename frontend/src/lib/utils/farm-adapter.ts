import type { MapFarm } from '$lib/types/farm';
import { getMarkerType } from '$lib/utils/farm-tags';

/** Subset of FarmDTO fields returned by `/api/farms`. */
export type FarmDto = Omit<MapFarm, 'markerType' | 'imageUrls' | 'thumbnailUrl' | 'cities_served'> & {
	cities_served: string[] | null;
};

const PLACEHOLDER_IMAGES = [
	'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=900&q=80',
	'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
	'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80'
];

function placeholderImages(id: string): string[] {
	const index = Number.parseInt(id.replace(/\D/g, '').slice(0, 6), 10) || 0;
	return [
		PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
		PLACEHOLDER_IMAGES[(index + 1) % PLACEHOLDER_IMAGES.length],
		PLACEHOLDER_IMAGES[(index + 2) % PLACEHOLDER_IMAGES.length]
	];
}

/**
 * Normalize API FarmDTO JSON into MapFarm (adds marker + display image fields).
 * Image URLs stay placeholders until Part E resolves cover/carousel IDs.
 */
export function farmDtoToMapFarm(dto: FarmDto): MapFarm {
	const imageUrls = placeholderImages(dto.id);

	const farm: MapFarm = {
		id: dto.id,
		owner_user_id: dto.owner_user_id,
		usda_farm_id: dto.usda_farm_id,
		farm_name: dto.farm_name,
		primary_phone: dto.primary_phone,
		primary_email: dto.primary_email,
		website: dto.website,
		social_media: dto.social_media,
		farm_address: dto.farm_address,
		county: dto.county,
		cities_served: dto.cities_served ?? [],
		location: dto.location,
		seasonal_products: dto.seasonal_products ?? [],
		meat_products: dto.meat_products ?? [],
		other_products: dto.other_products ?? [],
		seasonal_products_detail: dto.seasonal_products_detail,
		meat_products_detail: dto.meat_products_detail,
		other_products_detail: dto.other_products_detail,
		growing_practices: dto.growing_practices ?? [],
		food_safety_certifications: dto.food_safety_certifications ?? [],
		farm_experiences: dto.farm_experiences ?? [],
		farm_characteristics: dto.farm_characteristics ?? [],
		farm_to_school_sales: dto.farm_to_school_sales ?? [],
		market_sales_data: dto.market_sales_data,
		f2s_experience: dto.f2s_experience,
		delivery_details: dto.delivery_details,
		cover_photo: dto.cover_photo,
		carousel_photos: dto.carousel_photos ?? [],
		status: dto.status,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt,
		markerType: 'farm',
		imageUrls,
		thumbnailUrl: imageUrls[0]
	};

	farm.markerType = getMarkerType(farm);
	return farm;
}
