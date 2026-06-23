import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MISSISSIPPI_BOUNDS = 'rect:-91.655,30.173,-88.098,34.996';

interface GeoapifyResult {
	formatted?: string;
	lat?: number;
	lon?: number;
	place_id?: string;
	state_code?: string;
	state?: string;
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const apiKey = env.GEOAPIFY_API_KEY;

	if (!apiKey) {
		throw error(500, 'GEOAPIFY_API_KEY is not configured');
	}

	const text = url.searchParams.get('text')?.trim() ?? '';

	if (text.length < 3) {
		return json({ results: [] });
	}

	const params = new URLSearchParams({
		text,
		filter: MISSISSIPPI_BOUNDS,
		bias: 'countrycode:us',
		format: 'json',
		limit: '5',
		lang: 'en',
		apiKey
	});

	const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`);

	if (!res.ok) {
		throw error(502, 'Address lookup failed');
	}

	const data = await res.json();

	const results = ((data.results ?? []) as GeoapifyResult[])
		.filter((result) => result.state_code === 'MS' || result.state === 'Mississippi')
		.map((result) => ({
			formatted: result.formatted ?? '',
			lat: result.lat ?? null,
			lon: result.lon ?? null,
			placeId: result.place_id ?? ''
		}));

	return json({ results });
};
