import { browser } from '$app/environment';

import type { FarmLocation } from '$lib/types/farm';

type GeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

let coords = $state<FarmLocation | null>(null);
let status = $state<GeolocationStatus>('idle');

export const userLocation = {
	get coords() {
		return coords;
	},
	get status() {
		return status;
	}
};

export function requestUserLocation() {
	if (!browser || status === 'requesting' || status === 'granted') return;

	if (!('geolocation' in navigator)) {
		status = 'unavailable';
		return;
	}

	status = 'requesting';
	navigator.geolocation.getCurrentPosition(
		(position) => {
			coords = { lat: position.coords.latitude, lng: position.coords.longitude };
			status = 'granted';
		},
		() => {
			status = 'denied';
		},
		{ enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
	);
}
