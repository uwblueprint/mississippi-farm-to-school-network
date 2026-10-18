import { browser } from '$app/environment';

export interface BannerAnnouncement {
	id: string;
	/** Sanitized HTML (links allowed), set by admins. */
	title: string;
	date: string;
}

const STORAGE_KEY = 'public-announcements-minimized';

function readMinimizedIds(): string[] {
	if (!browser) return [];
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
	} catch {
		return [];
	}
}

let items = $state<BannerAnnouncement[]>([]);
let minimizedIds = $state<string[]>(readMinimizedIds());

export const announcementBar = {
	get items() {
		return items;
	},
	/** A newly posted announcement re-opens the bar even if older ones were minimized. */
	get minimized() {
		return items.length > 0 && items.every((a) => minimizedIds.includes(a.id));
	}
};

function persist(ids: string[]) {
	minimizedIds = ids;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// storage unavailable — the choice just won't survive a reload
	}
}

export function setAnnouncements(next: BannerAnnouncement[]) {
	items = next;
}

export function minimizeAnnouncements() {
	persist(items.map((a) => a.id));
}

export function restoreAnnouncements() {
	persist([]);
}
