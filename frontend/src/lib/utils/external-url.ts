const DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#]|$)/i;

/** Turn a farmer-entered web address into an absolute URL. Names return null. */
export function toAbsoluteUrl(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	if (trimmed.startsWith('//')) return `https:${trimmed}`;
	if (DOMAIN.test(trimmed)) return `https://${trimmed}`;
	return null;
}

/**
 * Direct profile URL when the value is already a link or a handle.
 * A plain name goes through a search that lands on the profile. Facebook's
 * own search path returns Not Found.
 */
export function profileUrl(
	value: string,
	site: string,
	handleUrl: (handle: string) => string
): string {
	const absolute = toAbsoluteUrl(value);
	if (absolute) return absolute;

	const handle = value.trim().replace(/^@/, '');
	if (handle && !/\s/.test(handle)) return handleUrl(handle);

	const query = encodeURIComponent(`${value.trim()} site:${site}`).replace(/%20/g, '+');
	return `https://duckduckgo.com/?q=!ducky+${query}`;
}
