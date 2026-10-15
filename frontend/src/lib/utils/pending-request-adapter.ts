// Adapts the admin queue GraphQL responses (`farmsByStatus(PENDING_APPROVAL)` and
// `farmDeletionRequests`) into `PendingRequest`s: the raw farm decorated with a
// queue-specific requestType.
import type { PendingFarmDto, PendingRequest } from '$lib/types/admin';
import { getFarmTags } from '$lib/utils/farm-tags';
import { formatRelativeTime } from '$lib/utils/relative-time';

/** Fields selected for every farm shown in an admin queue (pending, changes requested, deleted). */
const QUEUE_FARM_FIELDS = `
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
			was_previously_rejected
			deletion_requested_at
			deletion_approved_at
			createdAt
			updatedAt
			owner {
				id
				firstName
				lastName
				email
				phone
			}
`;

export const PENDING_FARMS_QUERY = `
	query PendingFarms {
		farmsByStatus(status: PENDING_APPROVAL) {${QUEUE_FARM_FIELDS}
		}
	}
`;

/** Farms whose owners asked for them to be deleted (not yet approved or denied). */
export const DELETION_REQUESTS_QUERY = `
	query FarmDeletionRequests {
		farmDeletionRequests {${QUEUE_FARM_FIELDS}
		}
	}
`;

/** `farmsByStatus` excludes archived farms, so these are only farms awaiting the farmer's edits. */
export const CHANGES_REQUESTED_FARMS_QUERY = `
	query ChangesRequestedFarms {
		farmsByStatus(status: REJECTED) {${QUEUE_FARM_FIELDS}
		}
	}
`;

export const ARCHIVED_FARMS_QUERY = `
	query ArchivedFarms($pageNumber: Int, $pageSize: Int) {
		farms(filter: { is_archived: true }, pageNumber: $pageNumber, pageSize: $pageSize) {${QUEUE_FARM_FIELDS}
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

export const UNARCHIVE_FARM_MUTATION = `
	mutation UnarchiveFarm($id: ID!) {
		unarchiveFarm(id: $id) {
			id
			is_archived
		}
	}
`;

export const APPROVE_FARM_DELETION_MUTATION = `
	mutation ApproveFarmDeletion($id: ID!) {
		approveFarmDeletion(id: $id) {
			id
			is_archived
		}
	}
`;

export const DENY_FARM_DELETION_MUTATION = `
	mutation DenyFarmDeletion($id: ID!) {
		denyFarmDeletion(id: $id) {
			id
			deletion_requested_at
		}
	}
`;

function isResubmission(farm: PendingFarmDto): boolean {
	return farm.was_previously_rejected;
}

/** Decorates one admin-queue farm with queue-specific fields. */
export function pendingFarmToRequest(farm: PendingFarmDto): PendingRequest {
	if (farm.deletion_requested_at) return { requestType: 'DELETION_REQUEST', farm };
	return {
		requestType: isResubmission(farm) ? 'UPDATED_APPLICATION' : 'NEW_APPLICATION',
		farm
	};
}

/** "Submitted 2 days ago", or "Deletion requested …" for a deletion request. */
export function requestTimeLabel(request: PendingRequest): string {
	if (request.requestType === 'DELETION_REQUEST' && request.farm.deletion_requested_at) {
		return `Deletion requested ${formatRelativeTime(request.farm.deletion_requested_at)}`;
	}
	return `Submitted ${formatRelativeTime(request.farm.updatedAt)}`;
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
