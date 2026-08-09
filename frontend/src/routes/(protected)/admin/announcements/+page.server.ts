import type { PageServerLoad } from './$types';
import { fetchAnnouncements } from '$lib/server/announcements';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	return { announcements: await fetchAnnouncements(fetch, cookies) };
};
