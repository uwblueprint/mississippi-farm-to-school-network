import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

interface SearchBoxFeature {
	geometry?: { coordinates?: [number, number] };
	properties?: {
		name?: string;
		full_address?: string;
		place_formatted?: string;
		coordinates?: { latitude?: number; longitude?: number };
	};
}

/** Resolves a suggestion from ../ (Search Box `suggest`) to a formatted address + coordinates. */
export const GET: RequestHandler = async ({ url, fetch }) => {
	const accessToken = env.MAPBOX_ACCESS_TOKEN;

	if (!accessToken) {
		throw error(500, 'MAPBOX_ACCESS_TOKEN is not configured');
	}

	const id = url.searchParams.get('id') ?? '';
	const session = url.searchParams.get('session') ?? '';

	if (!id || !session) {
		throw error(400, 'id and session are required');
	}

	const params = new URLSearchParams({ access_token: accessToken, session_token: session });
	const res = await fetch(
		`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(id)}?${params}`
	);

	if (!res.ok) {
		throw error(502, 'Address lookup failed');
	}

	const feature = ((await res.json()).features?.[0] ?? null) as SearchBoxFeature | null;
	const props = feature?.properties;
	const lat = props?.coordinates?.latitude ?? feature?.geometry?.coordinates?.[1] ?? null;
	const lon = props?.coordinates?.longitude ?? feature?.geometry?.coordinates?.[0] ?? null;

	if (!props || lat === null || lon === null) {
		throw error(404, 'Address not found');
	}

	const formatted = (
		props.full_address ?? [props.name, props.place_formatted].filter(Boolean).join(', ')
	).replace(/, United States$/, '');

	return json({ formatted, lat, lon });
};
