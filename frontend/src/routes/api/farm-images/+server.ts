import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGraphqlUrl } from '$lib/server/graphql-url';

const GET_IMAGES_QUERY = `
	query GetImages($farmId: String!) {
		getImages(farmId: $farmId) {
			id
			index
			url
			contentType
		}
	}
`;

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
	const farmId = url.searchParams.get('farmId')?.trim();

	if (!farmId) {
		return json(
			{
				ok: false,
				errors: [{ message: 'farmId is required.' }]
			},
			{ status: 400 }
		);
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	const token = cookies.get('token');
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(getGraphqlUrl(), {
		method: 'POST',
		headers,
		body: JSON.stringify({
			query: GET_IMAGES_QUERY,
			variables: { farmId }
		})
	});

	const body = await res.json();

	if (body.errors) {
		return json({ ok: false, errors: body.errors }, { status: 400 });
	}

	return json({ ok: true, images: body.data.getImages ?? [] });
};
