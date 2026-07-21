import type { FarmMarkerType } from '$lib/types/farm';

export type MarkerMeta = {
	color: string;
	label: string;
	icon: string;
};

export const MARKER_META: Record<FarmMarkerType, MarkerMeta> = {
	farm: {
		color: '#587244',
		label: 'Mississippi Farm',
		icon: '/images/map/mapMarkers/mississippiFarmIcon.svg'
	},
	market: {
		color: '#ea580c',
		label: 'Farmers Market',
		icon: '/images/map/mapMarkers/farmersMarketIcon.svg'
	},
	processing: {
		color: '#0d9488',
		label: 'Processing',
		icon: '/images/map/mapMarkers/processingIcon.svg'
	},
	csa: {
		color: '#7c3aed',
		label: 'CSA Farms',
		icon: '/images/map/mapMarkers/CSAFarmsIcon.svg'
	},
	pickup: {
		color: '#db2777',
		label: 'Pickup',
		icon: '/images/map/mapMarkers/pickupIcon.svg'
	}
};

export const MARKER_TYPE_ORDER: FarmMarkerType[] = [
	'farm',
	'market',
	'processing',
	'csa',
	'pickup'
];
