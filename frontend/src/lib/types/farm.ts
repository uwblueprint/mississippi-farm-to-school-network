export type FarmStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type FarmMarkerType = 'farm' | 'market' | 'processing' | 'csa' | 'pickup';

export type FoodCategorySection = 'Fruits and Vegetables' | 'Dairy and Eggs' | 'Herbs' | 'Meat' | 'Other';

export type FarmFoodCategoryItems = Partial<Record<FoodCategorySection, string[]>>;

export type FarmLocation = {
	lat: number;
	lng: number;
};

export type MapFarm = {
	id: string;
	owner_user_id: string;
	usda_farm_id: number;
	farm_name: string;
	description: string;
	primary_phone: string;
	primary_email: string;
	website: string | null;
	social_media: Record<string, unknown> | null;
	farm_address: string;
	counties_served: string[];
	cities_served: string[];
	home_county: string;
	location: FarmLocation;
	food_categories: string[];
	/** Mock-only breakdown of specific products per food category, until the backend supports per-item entry. */
	food_category_items: FarmFoodCategoryItems;
	market_sales_data: { market: string; times: string }[] | null;
	bipoc_owned: boolean;
	gap_certified: boolean;
	food_safety_plan: boolean;
	agritourism: boolean;
	sells_at_markets: boolean;
	csa_boxes: boolean;
	online_sales: boolean;
	delivery: boolean;
	f2s_experience: boolean;
	interested_in_f2s: boolean;
	status: FarmStatus;
	markerType: FarmMarkerType;
	/** Mock-only presentation images until the backend supports farm photos. */
	imageUrls: string[];
	thumbnailUrl: string;
	createdAt: string;
	updatedAt: string;
};

export type FarmTag =
	| 'Processing'
	| 'Pickup Location'
	| 'CSA Farm'
	| 'Mississippi Farm'
	| 'Farmers Market'
	| 'Field Trips';
