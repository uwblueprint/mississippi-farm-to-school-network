import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gqlRequest } from '$lib/server/graphql';

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
		const message = err instanceof Error ? err.message : 'createFarm failed';
		return json({ ok: false, errors: [{ message }] }, { status: 400 });
	}
};
