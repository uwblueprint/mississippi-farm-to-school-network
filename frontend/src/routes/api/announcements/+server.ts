import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	ANNOUNCEMENT_FIELDS,
	gqlRequest,
	toAnnouncement,
	type AnnouncementDTO
} from '$lib/server/announcements';

const CREATE_MUTATION = `
	mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
		createAnnouncement(input: $input) {
			announcement { ${ANNOUNCEMENT_FIELDS} }
			overlappingAnnouncements { ${ANNOUNCEMENT_FIELDS} }
		}
	}
`;

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const { message, startDate, endDate } = await request.json();

	const body = await gqlRequest<{
		createAnnouncement: {
			announcement: AnnouncementDTO;
			overlappingAnnouncements: AnnouncementDTO[];
		};
	}>(fetch, cookies, CREATE_MUTATION, {
		input: { message, start_date: startDate, end_date: endDate }
	});

	if (body.errors || !body.data) {
		return json({ ok: false, errors: body.errors ?? [] }, { status: 400 });
	}

	const result = body.data.createAnnouncement;
	return json({
		ok: true,
		announcement: toAnnouncement(result.announcement),
		overlappingAnnouncements: result.overlappingAnnouncements.map(toAnnouncement)
	});
};
