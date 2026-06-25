// Maps the backend FarmStatus enum (PENDING_APPROVAL | APPROVED | REJECTED)
// to a display label and badge colors. Keep these in sync with the backend
// FarmStatus enum in backend/graphql/types/farmType.ts.

export const FARM_STATUSES = ['APPROVED', 'PENDING_APPROVAL', 'REJECTED'] as const;

export type FarmStatus = (typeof FARM_STATUSES)[number];

export interface FarmStatusStyle {
	/** Text shown in the badge. */
	label: string;
	/** Badge background color. */
	background: string;
	/** Badge text color. */
	color: string;
}

export const FARM_STATUS_STYLES: Record<FarmStatus, FarmStatusStyle> = {
	APPROVED: { label: 'Active', background: '#FAFAFA', color: '#61636D' },
	PENDING_APPROVAL: { label: 'Pending', background: '#FDF1DD', color: '#B26B12' },
	REJECTED: { label: 'Action Required', background: '#FCE4E1', color: '#D9544C' }
};
