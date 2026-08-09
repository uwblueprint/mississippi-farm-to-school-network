export type ToastKind = 'success' | 'delete' | 'error';

export type Toast = {
	id: number;
	kind: ToastKind;
	message: string;
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

export function showToast(kind: ToastKind, message: string) {
	sequence += 1;
	current = { id: sequence, kind, message };
	clearTimeout(timer);
	timer = setTimeout(() => {
		current = null;
	}, DISMISS_AFTER_MS);
}

export function dismissToast() {
	clearTimeout(timer);
	current = null;
}
