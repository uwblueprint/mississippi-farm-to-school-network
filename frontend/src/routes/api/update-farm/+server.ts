import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGraphqlUrl } from '$lib/server/graphql-url';

const UPDATE_FARM_MUTATION = `
	mutation UpdateFarm($id: ID!, $input: UpdateFarmInput!) {
		updateFarm(id: $id, input: $input) {
			id
			cover_photo
			carousel_photos
		}
	}
`;

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const token = cookies.get('token');

	if (!token) {
		return json(
			{
				ok: false,
				errors: [{ message: 'You must be logged in to update a farm.' }]
			},
			{ status: 401 }
		);
	}

	const { id, input } = await request.json();

	if (!id || !input) {
		return json(
			{
				ok: false,
				errors: [{ message: 'id and input are required.' }]
			},
			{ status: 400 }
		);
	}

	const res = await fetch(getGraphqlUrl(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			query: UPDATE_FARM_MUTATION,
			variables: { id, input }
		})
	});

	const body = await res.json();

	if (body.errors) {
		return json({ ok: false, errors: body.errors }, { status: 400 });
	}

	return json({ ok: true, farm: body.data.updateFarm });
};
