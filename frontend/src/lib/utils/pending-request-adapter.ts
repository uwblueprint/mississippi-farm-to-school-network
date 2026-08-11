// Adapts the backend's `farmsByStatus(PENDING_APPROVAL)` GraphQL response into a
// `PendingRequest`: the raw farm decorated with queue-specific requestType.
import type { PendingFarmDto, PendingRequest } from '$lib/types/admin';
import { getFarmTags } from '$lib/utils/farm-tags';

export const PENDING_FARMS_QUERY = `
	query PendingFarms {
		farmsByStatus(status: PENDING_APPROVAL) {
			id
			owner_user_id
			farm_name
			farm_address
			county
			primary_email
			primary_phone
			website
			social_media
			cities_served
			seasonal_products
			meat_products
			other_products
			seasonal_products_detail
			meat_products_detail
			other_products_detail
			growing_practices
			food_safety_certifications
			farm_experiences
			farm_characteristics
			farm_to_school_sales
			market_sales_data {
				market
				times
			}
			f2s_experience
			delivery_details
			minimum_order
			cover_photo
			carousel_photos
			status
			createdAt
			updatedAt
			owner {
				id
				firstName
				lastName
				email
				phone
			}
		}
	}
`;

export const APPROVE_FARM_MUTATION = `
	mutation ApproveFarm($id: ID!) {
		approveFarm(id: $id) {
			id
			status
		}
	}
`;

export const REJECT_FARM_MUTATION = `
	mutation RejectFarm($id: ID!, $rejectionReason: String!) {
		rejectFarm(id: $id, rejectionReason: $rejectionReason) {
			id
			farm_id
			rejection_reason
		}
	}
`;

export const ARCHIVE_FARM_MUTATION = `
	mutation ArchiveFarm($id: ID!) {
		archiveFarm(id: $id) {
			id
			is_archived
		}
	}
`;

function isResubmission(farm: PendingFarmDto): boolean {
	return farm.createdAt !== farm.updatedAt;
}

/** Decorates one `farmsByStatus(PENDING_APPROVAL)` result with queue-specific fields. */
export function pendingFarmToRequest(farm: PendingFarmDto): PendingRequest {
	return {
		requestType: isResubmission(farm) ? 'UPDATED_APPLICATION' : 'NEW_APPLICATION',
		farm
	};
}

/** Headline map tag for a pending farm, or null when none apply. */
export function pendingFarmMapTag(farm: PendingFarmDto) {
	return getFarmTags(farm)[0] ?? null;
}

/** Owner display values with fallbacks when the Firestore profile is incomplete. */
export function pendingFarmOwner(farm: PendingFarmDto): {
	name: string;
	email: string;
	phone: string;
} {
	const name = [farm.owner?.firstName, farm.owner?.lastName]
		.filter((part): part is string => Boolean(part?.trim()))
		.join(' ');

	return {
		name,
		email: farm.owner?.email ?? farm.primary_email,
		phone: farm.owner?.phone ?? farm.primary_phone
	};
}
