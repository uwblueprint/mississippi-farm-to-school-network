import type { FarmStatus } from '$lib/types/farm';

/** Mirrors the `Role` enum on the backend (`backend/types.ts`). */
export type UserRole = 'ADMIN' | 'FARMER';

/**
 * Why a farm is sitting in the admin review queue.
 *
 * `NEW_APPLICATION` is a farm that has never been approved. `UPDATED_APPLICATION` is a
 * resubmission of a farm that was reviewed before — on the backend that is a
 * `farm_rejections` row whose `resolution_type` is `RESUBMITTED`.
 *
 * Frontend currently approximates this with createdAt !== updatedAt; the accurate
 * signal needs a GraphQL field that exposes resolved RESUBMITTED rejections
 * (`latestActiveFarmRejection` is null after resubmit clears the active row).
 */
export type PendingRequestType = 'NEW_APPLICATION' | 'UPDATED_APPLICATION';

/**
 * Frontend mirror of the backend FarmDTO (`backend/types.ts`), trimmed to the fields the
 * admin review queue displays, plus the GraphQL-only `owner` relation
 * (`backend/graphql/types/farmType.ts`) that's resolved for admins only — it isn't part of
 * the plain FarmDTO TS type, since it's resolved on demand rather than stored on the farm.
 */
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
