import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	ANNOUNCEMENT_FIELDS,
	gqlRequest,
	toAnnouncement,
	type AnnouncementDTO
} from '$lib/server/announcements';

const UPDATE_MUTATION = `
	mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {
		updateAnnouncement(id: $id, input: $input) {
			announcement { ${ANNOUNCEMENT_FIELDS} }
			overlappingAnnouncements { ${ANNOUNCEMENT_FIELDS} }
		}
	}
`;

const DELETE_MUTATION = `
	mutation DeleteAnnouncement($id: ID!) {
		deleteAnnouncement(id: $id) { ${ANNOUNCEMENT_FIELDS} }
	}
`;

export const PATCH: RequestHandler = async ({ request, params, fetch, cookies }) => {
	const { message, startDate, endDate } = await request.json();

	const body = await gqlRequest<{
		updateAnnouncement: {
			announcement: AnnouncementDTO;
			overlappingAnnouncements: AnnouncementDTO[];
		};
	}>(fetch, cookies, UPDATE_MUTATION, {
		id: params.id,
		input: { message, start_date: startDate, end_date: endDate }
	});

	if (body.errors || !body.data) {
		return json({ ok: false, errors: body.errors ?? [] }, { status: 400 });
	}

	const result = body.data.updateAnnouncement;
	return json({
		ok: true,
		announcement: toAnnouncement(result.announcement),
		overlappingAnnouncements: result.overlappingAnnouncements.map(toAnnouncement)
	});
};

export const DELETE: RequestHandler = async ({ params, fetch, cookies }) => {
	const body = await gqlRequest<{ deleteAnnouncement: AnnouncementDTO }>(
		fetch,
		cookies,
		DELETE_MUTATION,
		{ id: params.id }
	);

	if (body.errors || !body.data) {
		return json({ ok: false, errors: body.errors ?? [] }, { status: 400 });
	}

	return json({ ok: true, announcement: toAnnouncement(body.data.deleteAnnouncement) });
};
