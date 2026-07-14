import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MISSISSIPPI_BBOX = '-91.655,30.173,-88.098,34.996';

interface MapboxFeature {
	properties?: {
		full_address?: string;
		name?: string;
		mapbox_id?: string;
		coordinates?: { longitude?: number; latitude?: number };
		context?: {
			place?: { name?: string };
			region?: { region_code?: string; name?: string };
		};
	};
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const accessToken = env.MAPBOX_ACCESS_TOKEN;

	if (!accessToken) {
		throw error(500, 'MAPBOX_ACCESS_TOKEN is not configured');
	}

	const text = url.searchParams.get('text')?.trim() ?? '';

	if (text.length < 3) {
		return json({ results: [] });
	}

	const params = new URLSearchParams({
		q: text,
		access_token: accessToken,
		autocomplete: 'true',
		country: 'us',
		bbox: MISSISSIPPI_BBOX,
		types: 'address',
		limit: '5'
	});

	const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);

	if (!res.ok) {
		throw error(502, 'Address lookup failed');
	}

	const data = await res.json();

	const results = ((data.features ?? []) as MapboxFeature[])
		.filter((feature) => {
			const region = feature.properties?.context?.region;
			return region?.region_code === 'MS' || region?.name === 'Mississippi';
		})
		.map((feature) => {
			const props = feature.properties;
			const primary = props?.name ?? props?.full_address ?? '';
			const place = props?.context?.place?.name ?? '';
			const regionCode = props?.context?.region?.region_code ?? '';
			const secondary = [place, regionCode].filter(Boolean).join(', ');

			return {
				formatted: props?.full_address ?? props?.name ?? '',
				primary,
				secondary,
				lat: props?.coordinates?.latitude ?? null,
				lon: props?.coordinates?.longitude ?? null,
				placeId: props?.mapbox_id ?? ''
			};
		});

	return json({ results });
};
