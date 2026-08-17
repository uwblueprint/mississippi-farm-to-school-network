export type FarmStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type FarmMarkerType = 'farm' | 'market' | 'processing' | 'csa' | 'pickup';

export type FoodCategorySection =
	'Fruits and Vegetables' | 'Dairy and Eggs' | 'Herbs' | 'Meat' | 'Other';

export type FarmLocation = {
	lat: number;
	lng: number;
};

export type MarketSalesData = {
	market: string;
	times: string;
};

/**
 * Live farm shape for the map UI, aligned with backend FarmDTO.
 * `markerType`, `imageUrls`, and `thumbnailUrl` are adapter-derived for display.
 */
export type MapFarm = {
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
	cities_served: string[];
	location: FarmLocation;
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
	market_sales_data: MarketSalesData[] | null;
	f2s_experience: string | null;
	delivery_details: string | null;
	cover_photo: string | null;
	carousel_photos: string[];
	status: FarmStatus;
	createdAt: string;
	updatedAt: string;
	/** Derived for map marker styling. */
	markerType: FarmMarkerType;
	/** Resolved display URLs (placeholders until Part E). */
	imageUrls: string[];
	thumbnailUrl: string;
};

export type FarmTag =
	'Processing' | 'Pickup Location' | 'CSA Farm' | 'Farmers Market' | 'Field Trips';
