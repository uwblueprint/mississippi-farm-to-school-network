import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gqlRequest, GqlOperationError } from '$lib/server/graphql';

const CREATE_FARM_MUTATION = `
	mutation CreateFarm($input: CreateFarmInput!) {
		createFarm(input: $input) {
			id
			farm_name
			status
		}
	}
`;

interface CreateFarmResponse {
	createFarm: { id: string; farm_name: string; status: string };
}

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

	try {
		const { createFarm } = await gqlRequest<CreateFarmResponse>({
			query: CREATE_FARM_MUTATION,
			variables: { input },
			token,
			fetch
		});
		return json({ ok: true, farm: createFarm });
	} catch (err) {
		// Only an operation rejected by the backend is the client's fault; let
		// transport/server failures propagate as a 500 (matches the pre-gqlRequest
		// behavior).
		if (err instanceof GqlOperationError) {
			return json({ ok: false, errors: err.errors }, { status: 400 });
		}
		throw err;
	}
};
