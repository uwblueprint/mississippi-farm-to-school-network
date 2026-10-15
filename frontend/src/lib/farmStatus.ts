// Maps the backend FarmStatus enum (PENDING_APPROVAL | APPROVED | REJECTED)
// to a display label and badge colors. Keep these in sync with the backend
// FarmStatus enum in backend/graphql/types/farmType.ts.

import type { FarmStatus } from '$lib/types/farm';

export type { FarmStatus };

export interface FarmStatusStyle {
	/** Text shown in the badge. */
	label: string;
	/** Badge background color. */
	background: string;
	/** Badge text color. */
	color: string;
}

/**
 * What a farm card shows: the backend status, or DELETION_PENDING while the
 * owner's deletion request awaits admin review (the backend status is kept).
 */
export type FarmDisplayStatus = FarmStatus | 'DELETION_PENDING';

export const FARM_STATUS_STYLES: Record<FarmDisplayStatus, FarmStatusStyle> = {
	APPROVED: { label: 'Active', background: '#FAFAFA', color: '#61636D' },
	PENDING_APPROVAL: { label: 'Pending', background: '#FDF1DD', color: '#B26B12' },
	REJECTED: { label: 'Changes Requested', background: '#FCE4E1', color: '#D9544C' },
	DELETION_PENDING: { label: 'Deletion Pending', background: '#ECEEF2', color: '#4F545E' }
};

export function farmDisplayStatus(farm: {
	status: FarmStatus;
	deletion_requested_at?: string | null;
}): FarmDisplayStatus {
	return farm.deletion_requested_at ? 'DELETION_PENDING' : farm.status;
}
