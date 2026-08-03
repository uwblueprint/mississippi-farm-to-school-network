import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CREATE_FARM_MUTATION = `
	mutation CreateFarm($input: CreateFarmInput!) {
		createFarm(input: $input) {
			id
			farm_name
			status
		}
	}
`;

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const token = cookies.get('token');

	if (!token) {
		return json(
			{
				ok: false,
				errors: [{ message: 'You must be logged in to create a farm.' }]
			},
			{ status: 401 }
		);
	}

	const input = await request.json();

	const res = await fetch('http://mfsn-backend:3000/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ query: CREATE_FARM_MUTATION, variables: { input } })
	});

	const body = await res.json();

	if (body.errors) {
		return json({ ok: false, errors: body.errors }, { status: 400 });
	}

	return json({ ok: true, farm: body.data.createFarm });
};
