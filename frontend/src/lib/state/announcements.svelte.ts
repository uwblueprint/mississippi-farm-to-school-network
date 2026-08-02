import { mockAnnouncements } from '$lib/data/mock-announcements';
import type { Announcement } from '$lib/types/announcement';

let items = $state<Announcement[]>([...mockAnnouncements]);

export const announcements = {
	get all() {
		return items;
	}
};

export function getAnnouncement(id: string): Announcement | undefined {
	return items.find((a) => a.id === id);
}

export function createAnnouncement(data: Omit<Announcement, 'id'>): string {
	const id = crypto.randomUUID();
	items = [...items, { id, ...data }];
	return id;
}

export function updateAnnouncement(id: string, data: Omit<Announcement, 'id'>): void {
	items = items.map((a) => (a.id === id ? { ...a, ...data } : a));
}

export function deleteAnnouncement(id: string): void {
	items = items.filter((a) => a.id !== id);
}
