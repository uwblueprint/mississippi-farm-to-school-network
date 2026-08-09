import type { FeatureCollection, Point } from 'geojson';

import type { MapFarm } from '$lib/types/farm';

export function farmsToGeoJSON(farms: MapFarm[]): FeatureCollection<Point> {
	return {
		type: 'FeatureCollection',
		features: farms.map((farm) => ({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [farm.location.lng, farm.location.lat]
			},
			properties: {
				id: farm.id,
				farm_name: farm.farm_name,
				markerType: farm.markerType
			}
		}))
	};
}
