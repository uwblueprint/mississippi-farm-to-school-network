import type { FarmLocation } from '$lib/types/farm';

const EARTH_RADIUS_MILES = 3958.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceInMiles(from: FarmLocation, to: FarmLocation): number {
	const dLat = toRadians(to.lat - from.lat);
	const dLng = toRadians(to.lng - from.lng);
	const lat1 = toRadians(from.lat);
	const lat2 = toRadians(to.lat);

	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

	return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

export function formatDistanceLabel(miles: number): string {
	const value = miles < 10 ? miles.toFixed(1) : Math.round(miles).toString();
	const unit = value === '1' ? 'mile' : 'miles';
	return `${value} ${unit} away`;
}
