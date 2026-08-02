import type { PageServerLoad } from './$types';
import { fetchAnnouncements } from '$lib/server/announcements';

export const load: PageServerLoad = async ({ fetch, cookies, params }) => {
	const announcements = await fetchAnnouncements(fetch, cookies);
	return { announcement: announcements.find((a) => a.id === params.id) ?? null };
};
