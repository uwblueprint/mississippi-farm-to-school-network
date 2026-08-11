import type { FarmStatus } from '$lib/types/farm';

/** Mirrors the `Role` enum on the backend (`backend/types.ts`). */
export type UserRole = 'ADMIN' | 'FARMER';

export type PendingRequestType = 'NEW_APPLICATION' | 'UPDATED_APPLICATION';

export type PendingFarmDto = {
	id: string;
	owner_user_id: string;
	farm_name: string;
	farm_address: string;
	county: string;
	primary_email: string;
	primary_phone: string;
	website: string | null;
	social_media: Record<string, unknown> | null;
	cities_served: string[];
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
	minimum_order: string | number | null;
	cover_photo: string | null;
	carousel_photos: string[];
	status: FarmStatus;
	was_previously_rejected: boolean;
	createdAt: string;
	updatedAt: string;
	owner: {
		id: string;
		firstName: string | null;
		lastName: string | null;
		email: string;
		phone: string | null;
	} | null;
};

/** A farm awaiting admin review, plus the queue-specific request type. */
export type PendingRequest = {
	requestType: PendingRequestType;
	farm: PendingFarmDto;
};

export type RequestFilter = 'ALL' | PendingRequestType;

export type RequestSort = 'NEWEST' | 'OLDEST' | 'NAME_ASC';
