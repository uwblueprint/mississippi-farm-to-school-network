// Loads the farms shown on the admin Deleted & Archived page: soft-deleted farms
// (status DELETED) and archived farms, merged into one list.
import { gqlClient } from '$lib/graphqlClient';
import type { RemovedFarm, RemovedFarmDto } from '$lib/types/admin';
import { formatRelativeTime } from '$lib/utils/relative-time';

/** The farms resolver caps pageSize at 100. */
const FETCH_PAGE_SIZE = 100;

const REMOVED_FARMS_QUERY = `
	query RemovedFarms($filter: FarmFilter, $pageNumber: Int!, $pageSize: Int!) {
		farms(filter: $filter, pageNumber: $pageNumber, pageSize: $pageSize) {
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
			is_archived
			was_previously_rejected
			deleted_at
			deletion_reason
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

export const RESTORE_FARM_MUTATION = `
	mutation RestoreFarm($id: ID!) {
		restoreFarm(id: $id) {
			id
			status
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

export const PERMANENTLY_DELETE_FARM_MUTATION = `
	mutation PermanentlyDeleteFarm($id: ID!) {
		permanentlyDeleteFarm(id: $id)
	}
`;

async function fetchAllFarms(filter: Record<string, unknown>): Promise<RemovedFarmDto[]> {
	const all: RemovedFarmDto[] = [];
	for (let pageNumber = 1; ; pageNumber++) {
		const data = await gqlClient<{ farms: RemovedFarmDto[] }>(REMOVED_FARMS_QUERY, {
			filter,
			pageNumber,
			pageSize: FETCH_PAGE_SIZE
		});
		all.push(...data.farms);
		if (data.farms.length < FETCH_PAGE_SIZE) return all;
	}
}

export async function loadRemovedFarms(): Promise<RemovedFarm[]> {
	const [deleted, archived] = await Promise.all([
		fetchAllFarms({ status: 'DELETED' }),
		fetchAllFarms({ is_archived: true })
	]);

	return [
		...deleted.map((farm) => ({ kind: 'DELETED' as const, farm })),
		...archived
			.filter((farm) => farm.status !== 'DELETED')
			.map((farm) => ({ kind: 'ARCHIVED' as const, farm }))
	];
}

/**
 * The date a removed farm is sorted and labelled by. Archiving doesn't record its own
 * timestamp, so archived farms fall back to their last update.
 */
export function removedAt(item: RemovedFarm): string {
	return (item.kind === 'DELETED' && item.farm.deleted_at) || item.farm.updatedAt;
}

export function removedFarmTimestamp(item: RemovedFarm): string {
	const prefix = item.kind === 'DELETED' ? 'Deleted' : 'Last updated';
	return `${prefix} ${formatRelativeTime(removedAt(item))}`;
}
