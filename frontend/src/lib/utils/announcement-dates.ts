import type { Announcement, AnnouncementStatus } from '$lib/types/announcement';

export function parseDate(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day);
}

export function toDateString(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfToday(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function statusOf(announcement: Announcement): AnnouncementStatus {
	const today = startOfToday().getTime();
	if (parseDate(announcement.startDate).getTime() > today) return 'scheduled';
	if (parseDate(announcement.endDate).getTime() < today) return 'expired';
	return 'active';
}

export function formatLongDate(value: string): string {
	return parseDate(value).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatShortDate(value: string): string {
	return parseDate(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function isStartingNow(startDate: string): boolean {
	return parseDate(startDate).getTime() <= startOfToday().getTime();
}
