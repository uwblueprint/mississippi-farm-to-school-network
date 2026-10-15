import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGraphqlUrl } from '$lib/server/graphql-url';
import { formatLongDate } from '$lib/utils/announcement-dates';

const PUBLIC_ANNOUNCEMENTS = `
	query PublicAnnouncements {
		publicAnnouncements {
			id
			message
			start_date
		}
	}
`;

type PublicAnnouncementDTO = {
	id: string;
	message: string;
	start_date: string;
};

function toDateOnly(iso: string): string {
	return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

/** Live announcements for the public farm map; no auth required. */
export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: PUBLIC_ANNOUNCEMENTS })
		});
		const payload = await res.json();

		if (!res.ok || payload.errors) {
			return json({ ok: false, errors: payload.errors ?? [] }, { status: 502 });
		}

		const announcements = (payload.data.publicAnnouncements as PublicAnnouncementDTO[]).map(
			(a) => ({
				id: a.id,
				title: a.message,
				date: formatLongDate(toDateOnly(a.start_date))
			})
		);
		return json({ ok: true, announcements });
	} catch {
		return json({ ok: false, errors: [{ message: 'Backend unavailable.' }] }, { status: 502 });
	}
};
