import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGraphqlUrl } from '$lib/server/graphql-url';

const FARM_FIELDS = `
	id
	owner_user_id
	usda_farm_id
	farm_name
	primary_phone
	primary_email
	website
	social_media
	farm_address
	county
	cities_served
	location { lat lng }
	seasonal_products
	meat_products
	other_products
	seasonal_products_detail
	meat_products_detail
	other_products_detail
	growing_practices
	food_safety_certifications
	farm_experiences
	farm_characteristics
	farm_to_school_sales
	market_sales_data { market times }
	f2s_experience
	delivery_details
	cover_photo
	carousel_photos
	status
	createdAt
	updatedAt
`;

const FARMS_QUERY = `
	query Farms {
		farms {
			${FARM_FIELDS}
		}
	}
`;

const FARMS_BY_PROXIMITY_QUERY = `
	query FarmsByProximity($lat: Float!, $lng: Float!, $radiusKm: Float!) {
		farmsByProximity(lat: $lat, lng: $lng, radiusKm: $radiusKm) {
			${FARM_FIELDS}
		}
	}
`;

export const GET: RequestHandler = async ({ url, fetch }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const radiusKm = url.searchParams.get('radiusKm');

	const useProximity = lat !== null && lng !== null && radiusKm !== null;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	const body = useProximity
		? {
				query: FARMS_BY_PROXIMITY_QUERY,
				variables: {
					lat: Number(lat),
					lng: Number(lng),
					radiusKm: Number(radiusKm)
				}
			}
		: { query: FARMS_QUERY };

	const res = await fetch(getGraphqlUrl(), {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	const payload = await res.json();

	if (payload.errors) {
		return json({ ok: false, errors: payload.errors }, { status: 400 });
	}

	const farms = useProximity ? payload.data.farmsByProximity : payload.data.farms;
	return json({ ok: true, farms });
};
