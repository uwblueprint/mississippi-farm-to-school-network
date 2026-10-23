import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gqlRequest, GqlOperationError } from '$lib/server/graphql';

const CREATE_FARM_FOR_FARMER_MUTATION = `
	mutation CreateFarmForFarmer($email: String!, $input: CreateFarmInput!) {
		createFarmForFarmer(email: $email, input: $input) {
			id
			farm_name
			status
		}
	}
`;

interface CreateFarmForFarmerResponse {
	createFarmForFarmer: { id: string; farm_name: string; status: string };
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

	const { email, input } = await request.json();

	try {
		const { createFarmForFarmer } = await gqlRequest<CreateFarmForFarmerResponse>({
			query: CREATE_FARM_FOR_FARMER_MUTATION,
			variables: { email, input },
			token,
			fetch
		});
		return json({ ok: true, farm: createFarmForFarmer });
	} catch (err) {
		// Only an operation rejected by the backend is the client's fault; let
		// transport/server failures propagate as a 500.
		if (err instanceof GqlOperationError) {
			return json({ ok: false, errors: err.errors }, { status: 400 });
		}
		throw err;
	}
};
