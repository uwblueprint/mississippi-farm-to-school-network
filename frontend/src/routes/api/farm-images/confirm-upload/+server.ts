import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGraphqlUrl } from '$lib/server/graphql-url';

const CONFIRM_UPLOAD_MUTATION = `
	mutation UploadImageToFarm($input: UploadImageInput!) {
		uploadImageToFarm(input: $input) {
			id
			farmId
			index
		}
	}
`;

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const token = cookies.get('token');

	if (!token) {
		return json(
			{
				ok: false,
				errors: [{ message: 'You must be logged in to upload farm images.' }]
			},
			{ status: 401 }
		);
	}

	const input = await request.json();

	const res = await fetch(getGraphqlUrl(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			query: CONFIRM_UPLOAD_MUTATION,
			variables: { input }
		})
	});

	const body = await res.json();

	if (body.errors) {
		return json({ ok: false, errors: body.errors }, { status: 400 });
	}

	return json({ ok: true, image: body.data.uploadImageToFarm });
};
