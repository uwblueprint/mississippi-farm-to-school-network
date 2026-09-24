import { gqlClient } from '$lib/graphqlClient';
import { formatLongDate } from '$lib/utils/announcement-dates';
import type { LayoutLoad } from './$types';

const LIVE_ANNOUNCEMENTS = `
	query LiveAnnouncements {
		liveAnnouncements {
			id
			message
			start_date
		}
	}
`;

type LiveAnnouncementDTO = {
	id: string;
	message: string;
	start_date: string;
};

function toDateOnly(iso: string): string {
	return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

export const load: LayoutLoad = async () => {
	try {
		const data = await gqlClient<{ liveAnnouncements: LiveAnnouncementDTO[] }>(LIVE_ANNOUNCEMENTS);
		return {
			announcements: data.liveAnnouncements.map((a) => ({
				id: a.id,
				title: a.message,
				date: formatLongDate(toDateOnly(a.start_date))
			}))
		};
	} catch {
		return { announcements: [] };
	}
};
