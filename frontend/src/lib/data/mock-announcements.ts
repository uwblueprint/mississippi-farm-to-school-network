import type { Announcement } from '$lib/types/announcement';

export const mockAnnouncements: Announcement[] = [
	{
		id: 'ann-1',
		message: 'A handful of educator farms will be closed the week of Easter Monday.',
		startDate: '2026-06-22',
		endDate: '2026-08-22'
	},
	{
		id: 'ann-2',
		message: 'Blueberries now in season!',
		startDate: '2026-08-10',
		endDate: '2026-09-05'
	},
	{
		id: 'ann-3',
		message: 'Fall farm to school registration opens soon — sign up early to reserve a visit.',
		startDate: '2026-09-01',
		endDate: '2026-09-30'
	},
	{
		id: 'ann-4',
		message: 'Spring produce boxes are sold out for the season.',
		startDate: '2026-05-01',
		endDate: '2026-05-15'
	},
	{
		id: 'ann-5',
		message: 'Sign-ups for the March educator farm tour are now closed.',
		startDate: '2026-03-19',
		endDate: '2026-04-11'
	}
];
