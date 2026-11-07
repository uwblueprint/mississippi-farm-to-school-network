export type ToastKind = 'success' | 'delete' | 'error';

export type Toast = {
	id: number;
	kind: ToastKind;
	message: string;
	/** Optional heading above the message (e.g. "CSV Export Complete"). */
	title?: string;
	/** Stays until the user closes it, for messages they need to act on. */
	persist?: boolean;
};

const DISMISS_AFTER_MS = 4000;

let current = $state<Toast | null>(null);
let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = {
	get current() {
		return current;
	}
};

export function showToast(
	kind: ToastKind,
	message: string,
	title?: string,
	{ persist = false }: { persist?: boolean } = {}
) {
	sequence += 1;
	current = { id: sequence, kind, message, title, persist };
	clearTimeout(timer);
	if (persist) return;
	timer = setTimeout(() => {
		current = null;
	}, DISMISS_AFTER_MS);
}

export function dismissToast() {
	clearTimeout(timer);
	current = null;
}
