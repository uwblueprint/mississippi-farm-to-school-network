import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Mapbox Search Box API: built for type-ahead (partial streets, POIs), unlike the forward
// geocoder which only matches near-complete addresses. Suggestions carry no coordinates;
// the client resolves the chosen one via ./retrieve with the same session token.
const MISSISSIPPI_BBOX = '-91.655,30.173,-88.098,34.996';
const MAX_RESULTS = 6;
/** Slots kept for businesses/landmarks when addresses would otherwise fill the list. */
const MIN_POIS = 2;

interface SearchBoxSuggestion {
	mapbox_id: string;
	name: string;
	feature_type: string;
	full_address?: string;
	address?: string;
	place_formatted?: string;
	context?: {
		place?: { name?: string };
		region?: { region_code?: string; name?: string };
	};
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const accessToken = env.MAPBOX_ACCESS_TOKEN;

	if (!accessToken) {
		throw error(500, 'MAPBOX_ACCESS_TOKEN is not configured');
	}

	const text = url.searchParams.get('text')?.trim() ?? '';
	const session = url.searchParams.get('session') ?? '';

	if (text.length < 2 || !session) {
		return json({ results: [] });
	}

	const suggest = async (types: string): Promise<SearchBoxSuggestion[]> => {
		const params = new URLSearchParams({
			q: text,
			access_token: accessToken,
			session_token: session,
			country: 'us',
			bbox: MISSISSIPPI_BBOX,
			types,
			language: 'en',
			// the bbox overlaps AL/LA; over-fetch so the MS filter still leaves a full list
			limit: '10'
		});
		const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`);
		if (!res.ok) {
			throw error(502, 'Address lookup failed');
		}
		const data = await res.json();
		return ((data.suggestions ?? []) as SearchBoxSuggestion[]).filter((s) => {
			const region = s.context?.region;
			return region?.region_code === 'MS' || region?.name === 'Mississippi';
		});
	};

	// Mapbox ranks POIs above streets when they share a request, so a typed street name
	// ("Old Canton") only surfaced businesses. Query separately and lead with addresses.
	const [addresses, pois] = await Promise.all([suggest('address,street'), suggest('poi')]);
	const leadingAddresses = addresses.slice(0, MAX_RESULTS - Math.min(pois.length, MIN_POIS));
	const merged = [...leadingAddresses, ...pois.slice(0, MAX_RESULTS - leadingAddresses.length)];

	const results = merged.map((s) => ({
		placeId: s.mapbox_id,
		primary: s.name,
		// POIs show their street address under the name; addresses show the town
		secondary:
			s.feature_type === 'poi' && s.address
				? [s.address, s.context?.place?.name].filter(Boolean).join(', ')
				: (s.place_formatted ?? '').replace(/, United States$/, ''),
		kind: s.feature_type
	}));

	return json({ results });
};
