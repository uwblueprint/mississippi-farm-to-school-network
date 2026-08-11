const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pluralize(value: number, unit: string): string {
	return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

/** Formats a past ISO timestamp as a coarse "3 hours ago" style label. */
export function formatRelativeTime(isoTimestamp: string, now: Date = new Date()): string {
	const elapsed = now.getTime() - new Date(isoTimestamp).getTime();

	if (elapsed < MINUTE) return 'just now';
	if (elapsed < HOUR) return pluralize(Math.floor(elapsed / MINUTE), 'minute');
	if (elapsed < DAY) return pluralize(Math.floor(elapsed / HOUR), 'hour');
	if (elapsed < 30 * DAY) return pluralize(Math.floor(elapsed / DAY), 'day');

	return new Date(isoTimestamp).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}
