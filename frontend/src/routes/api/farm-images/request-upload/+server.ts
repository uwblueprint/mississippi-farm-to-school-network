import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGraphqlUrl } from '$lib/server/graphql-url';

const REQUEST_UPLOAD_MUTATION = `
	mutation RequestImageUploadUrl($farmId: String!, $contentType: String!) {
		requestImageUploadUrl(farmId: $farmId, contentType: $contentType) {
			uploadUrl
			imageId
			storageKey
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

	const { farmId, contentType } = await request.json();

	if (!farmId || !contentType) {
		return json(
			{
				ok: false,
				errors: [{ message: 'farmId and contentType are required.' }]
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
			query: REQUEST_UPLOAD_MUTATION,
			variables: { farmId, contentType }
		})
	});

	const body = await res.json();

	if (body.errors) {
		return json({ ok: false, errors: body.errors }, { status: 400 });
	}

	return json({ ok: true, ...body.data.requestImageUploadUrl });
};
