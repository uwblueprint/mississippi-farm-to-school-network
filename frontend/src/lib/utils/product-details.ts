/** Older farms stored combined seasonal labels. The form now asks for each group. */
const LEGACY_SEASONAL: Record<string, string[]> = {
	'Fruits and Vegetables': ['Fruits', 'Vegetables'],
	'Dairy and Eggs': ['Dairy', 'Eggs']
};

export function expandProductCategories(values: string[] | null | undefined): string[] {
	const next: string[] = [];
	for (const value of values ?? []) {
		if (!value || value === 'None of the above') continue;
		const parts = LEGACY_SEASONAL[value];
		if (parts) next.push(...parts);
		else next.push(value);
	}
	return [...new Set(next)];
}

/** Form state key. Meat "Other" and other-products "Other" stay separate. */
export function productNoteKey(group: string, category: string): string {
	return `${group}:${category}`;
}

/** One line per category so each food group keeps its own list. */
export function encodeCategoryDetails(
	group: string,
	categories: string[],
	notes: Record<string, string>
): string {
	return categories
		.map((category) => {
			const value = notes[productNoteKey(group, category)]?.trim() ?? '';
			return value ? `${category}: ${value}` : '';
		})
		.filter(Boolean)
		.join('\n');
}

/**
 * Read per-category notes. A legacy unlabeled paragraph is kept on the first
 * selected category so it is not copied onto every icon.
 */
export function decodeCategoryDetails(
	detail: string | null | undefined,
	categories: string[]
): Record<string, string> {
	const notes: Record<string, string> = {};
	const raw = detail?.trim() ?? '';
	if (!raw) return notes;

	let labeled = false;
	for (const line of raw.split('\n')) {
		const splitAt = line.indexOf(':');
		if (splitAt <= 0) continue;
		const key = line.slice(0, splitAt).trim();
		const value = line.slice(splitAt + 1).trim();
		if (!key) continue;
		notes[key] = value;
		labeled = true;
	}

	if (!labeled && categories[0]) notes[categories[0]] = raw;
	return notes;
}
