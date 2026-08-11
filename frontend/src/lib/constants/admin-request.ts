import type { PendingRequestType, RequestSort } from '$lib/types/admin';
import type { FarmTag } from '$lib/types/farm';

export const REQUEST_TYPE_LABEL: Record<PendingRequestType, string> = {
	NEW_APPLICATION: 'New Application',
	UPDATED_APPLICATION: 'Updated Application'
};

export const REQUEST_TYPE_MODIFIER: Record<PendingRequestType, string> = {
	NEW_APPLICATION: 'new-application',
	UPDATED_APPLICATION: 'updated-application'
};

export const MAP_TAG_MODIFIER: Record<FarmTag, string> = {
	'Farmers Market': 'farmers-market',
	Processing: 'processing',
	'CSA Farm': 'csa-farm',
	'Pickup Location': 'pickup-location',
	'Field Trips': 'field-trips'
};

export const CHANGE_REASONS = [
	'Missing or incomplete information',
	'Inaccurate information',
	'Photos do not meet requirements',
	'Eligibility requirements not met',
	'Other'
] as const;

export const ADMIN_SORT_ITEMS: { value: RequestSort; label: string }[] = [
	{ value: 'NEWEST', label: 'Newest first' },
	{ value: 'OLDEST', label: 'Oldest first' },
	{ value: 'NAME_ASC', label: 'Farm name (A–Z)' }
];

export const ADMIN_FILTER_LABELS: Record<'ALL' | PendingRequestType, string> = {
	ALL: 'All Requests',
	NEW_APPLICATION: 'New Applications',
	UPDATED_APPLICATION: 'Updated Applications'
};
