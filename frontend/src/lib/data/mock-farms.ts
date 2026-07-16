import type { FeatureCollection, Point } from 'geojson';

import type { FarmFoodCategoryItems, FarmMarkerType, MapFarm } from '$lib/types/farm';

const FARM_IMAGES = [
	'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=900&q=80',
	'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
	'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80',
	'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80',
	'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80'
];

function imagesForFarm(id: string): string[] {
	const index = Number.parseInt(id.replace(/\D/g, ''), 10) || 0;
	const primary = FARM_IMAGES[index % FARM_IMAGES.length];
	const secondary = FARM_IMAGES[(index + 1) % FARM_IMAGES.length];
	const tertiary = FARM_IMAGES[(index + 2) % FARM_IMAGES.length];
	return [primary, secondary, tertiary];
}

function markerTypeForFarm(farm: Pick<MapFarm, 'csa_boxes' | 'delivery' | 'sells_at_markets' | 'gap_certified'>): FarmMarkerType {
	if (farm.csa_boxes) return 'csa';
	if (farm.delivery) return 'pickup';
	if (farm.sells_at_markets) return 'market';
	if (farm.gap_certified) return 'processing';
	return 'farm';
}

function baseFarm(
	overrides: Partial<MapFarm> & Pick<MapFarm, 'id' | 'farm_name' | 'farm_address' | 'home_county' | 'location' | 'description'>
): MapFarm {
	const imageUrls = overrides.imageUrls ?? imagesForFarm(overrides.id);
	const foodCategoryItems: FarmFoodCategoryItems = overrides.food_category_items ?? {
		'Fruits and Vegetables': ['Mixed Vegetables']
	};
	const partial = {
		owner_user_id: '00000000-0000-0000-0000-000000000001',
		usda_farm_id: 100001,
		primary_phone: '(601) 555-0100',
		primary_email: 'hello@example.com',
		website: null,
		social_media: null,
		counties_served: [overrides.home_county],
		cities_served: [overrides.home_county.replace(' County', '')],
		food_category_items: foodCategoryItems,
		market_sales_data: null,
		bipoc_owned: false,
		gap_certified: false,
		food_safety_plan: false,
		agritourism: false,
		sells_at_markets: false,
		csa_boxes: false,
		online_sales: false,
		delivery: false,
		f2s_experience: false,
		interested_in_f2s: true,
		status: 'APPROVED' as const,
		imageUrls,
		thumbnailUrl: imageUrls[0],
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
		...overrides,
		food_categories: overrides.food_categories ?? Object.keys(foodCategoryItems)
	};

	return {
		...partial,
		imageUrls: overrides.imageUrls ?? imageUrls,
		thumbnailUrl: overrides.thumbnailUrl ?? imageUrls[0],
		markerType: overrides.markerType ?? markerTypeForFarm(partial)
	};
}

export const MOCK_FARMS: MapFarm[] = [
	baseFarm({
		id: 'farm-001',
		farm_name: 'Meadow View Farm',
		description:
			'Family-owned produce farm supplying seasonal vegetables and herbs to schools and farmers markets across central Mississippi.',
		farm_address: '456 Orchard Ln, Jackson, MS 39201',
		home_county: 'Hinds County',
		location: { lat: 32.2988, lng: -90.1848 },
		food_category_items: {
			'Fruits and Vegetables': ['Tomatoes', 'Squash', 'Bell Peppers'],
			Herbs: ['Basil', 'Cilantro']
		},
		gap_certified: true,
		f2s_experience: true
	}),
	baseFarm({
		id: 'farm-002',
		farm_name: 'Sunshine Farm',
		description: 'Certified organic vegetables and cut flowers with weekly CSA boxes for families and schools.',
		farm_address: '88 Delta Rd, Greenwood, MS 38930',
		home_county: 'Leflore County',
		location: { lat: 33.5162, lng: -90.1795 },
		food_category_items: {
			'Fruits and Vegetables': ['Carrots', 'Cucumbers'],
			Other: ['Cut Flowers']
		},
		csa_boxes: true,
		online_sales: true
	}),
	baseFarm({
		id: 'farm-003',
		farm_name: 'Oxford Heritage Acres',
		description: 'Pastured poultry and seasonal produce with agritourism weekends in the fall.',
		farm_address: '210 College Hill Rd, Oxford, MS 38655',
		home_county: 'Lafayette County',
		location: { lat: 34.3665, lng: -89.5192 },
		food_category_items: {
			Meat: ['Pastured Chicken', 'Turkey'],
			'Fruits and Vegetables': ['Sweet Corn', 'Green Beans']
		},
		agritourism: true,
		sells_at_markets: true
	}),
	baseFarm({
		id: 'farm-004',
		farm_name: 'Gulf Coast Greens',
		description: 'Year-round leafy greens and microgreens for coastal districts and restaurants.',
		farm_address: '15 Beach Blvd, Biloxi, MS 39530',
		home_county: 'Harrison County',
		location: { lat: 30.396, lng: -88.8853 },
		food_category_items: {
			'Fruits and Vegetables': ['Kale', 'Spinach', 'Microgreens']
		},
		delivery: true,
		food_safety_plan: true
	}),
	baseFarm({
		id: 'farm-005',
		farm_name: 'Tupelo Berry Patch',
		description: 'Blueberries, blackberries, and value-added jams sold at regional farmers markets.',
		farm_address: '742 County Rd 101, Tupelo, MS 38801',
		home_county: 'Lee County',
		location: { lat: 34.2576, lng: -88.7034 },
		food_category_items: {
			'Fruits and Vegetables': ['Blueberries', 'Blackberries'],
			Other: ['Berry Jam']
		},
		sells_at_markets: true,
		bipoc_owned: true
	}),
	baseFarm({
		id: 'farm-006',
		farm_name: 'Pine Belt Produce',
		description: 'Sweet potatoes, squash, and melons with on-farm pickup for bulk school orders.',
		farm_address: '903 Hardy St, Hattiesburg, MS 39401',
		home_county: 'Forrest County',
		location: { lat: 31.3271, lng: -89.2903 },
		food_category_items: {
			'Fruits and Vegetables': ['Sweet Potatoes', 'Squash', 'Watermelon']
		},
		delivery: true,
		interested_in_f2s: true
	}),
	baseFarm({
		id: 'farm-007',
		farm_name: 'Delta Harvest Co-op',
		description: 'Cooperative of small growers offering washed and bagged greens for cafeteria programs.',
		farm_address: '120 Main St, Greenville, MS 38701',
		home_county: 'Washington County',
		location: { lat: 33.4101, lng: -91.0617 },
		food_category_items: {
			'Fruits and Vegetables': ['Collard Greens', 'Mustard Greens']
		},
		gap_certified: true,
		f2s_experience: true
	}),
	baseFarm({
		id: 'farm-008',
		farm_name: 'Meridian Orchard',
		description: 'Apples, pears, and cider with school orchard tour programming each spring.',
		farm_address: '55 Orchard Way, Meridian, MS 39301',
		home_county: 'Lauderdale County',
		location: { lat: 34.3643, lng: -88.7037 },
		food_category_items: {
			'Fruits and Vegetables': ['Apples', 'Pears'],
			Other: ['Apple Cider']
		},
		agritourism: true,
		f2s_experience: true
	}),
	baseFarm({
		id: 'farm-009',
		farm_name: 'Natchez Trace Farm',
		description: 'Heirloom tomatoes, peppers, and eggs with Saturday market sales in downtown Natchez.',
		farm_address: '17 Trace Pkwy, Natchez, MS 39120',
		home_county: 'Adams County',
		location: { lat: 31.5604, lng: -91.4032 },
		food_category_items: {
			'Fruits and Vegetables': ['Heirloom Tomatoes', 'Peppers'],
			'Dairy and Eggs': ['Chicken Eggs']
		},
		sells_at_markets: true,
		website: 'https://example.com/natchez-trace-farm'
	}),
	baseFarm({
		id: 'farm-010',
		farm_name: 'Starkville Student Farm',
		description: 'University-affiliated teaching farm providing salad greens and herbs to campus and nearby schools.',
		farm_address: '400 Blackjack Rd, Starkville, MS 39759',
		home_county: 'Oktibbeha County',
		location: { lat: 33.4504, lng: -88.8184 },
		food_category_items: {
			'Fruits and Vegetables': ['Lettuce', 'Arugula'],
			Herbs: ['Mint', 'Thyme']
		},
		csa_boxes: true,
		f2s_experience: true
	}),
	baseFarm({
		id: 'farm-011',
		farm_name: 'Coastal Roots CSA',
		description: 'Subscription vegetable boxes with optional home delivery along the Gulf Coast.',
		farm_address: '2200 Pass Rd, Gulfport, MS 39501',
		home_county: 'Harrison County',
		location: { lat: 30.3674, lng: -89.0928 },
		food_category_items: {
			'Fruits and Vegetables': ['Zucchini', 'Okra', 'Onions']
		},
		csa_boxes: true,
		delivery: true,
		online_sales: true
	}),
	baseFarm({
		id: 'farm-012',
		farm_name: 'Columbus Community Garden Network',
		description: 'Aggregated produce from neighborhood gardens supporting local cafeteria pilots.',
		farm_address: '88 Main St, Columbus, MS 39701',
		home_county: 'Lowndes County',
		location: { lat: 33.4957, lng: -88.4273 },
		food_category_items: {
			'Fruits and Vegetables': ['Tomatoes', 'Peppers', 'Squash']
		},
		bipoc_owned: true,
		interested_in_f2s: true
	}),
	baseFarm({
		id: 'farm-013',
		farm_name: 'Clarksdale Blues Farm',
		description: 'Southern greens, okra, and peas with GAP-certified post-harvest handling.',
		farm_address: '301 Blues Alley, Clarksdale, MS 38614',
		home_county: 'Coahoma County',
		location: { lat: 34.2001, lng: -90.5709 },
		food_category_items: {
			'Fruits and Vegetables': ['Collard Greens', 'Okra', 'Field Peas']
		},
		gap_certified: true,
		food_safety_plan: true
	})
];

export function farmsToGeoJSON(farms: MapFarm[]): FeatureCollection<Point> {
	return {
		type: 'FeatureCollection',
		features: farms.map((farm) => ({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [farm.location.lng, farm.location.lat]
			},
			properties: {
				id: farm.id,
				farm_name: farm.farm_name,
				markerType: farm.markerType
			}
		}))
	};
}
