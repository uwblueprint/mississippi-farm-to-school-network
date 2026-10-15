import { CHANGE_REASONS } from '$lib/constants/admin-request';

// The backend stores a rejection as one string. The review form writes it as
// "<reason>; <reason> - <comments>", and parseRejectionReason reverses that.
const REASON_SEPARATOR = '; ';
const COMMENTS_SEPARATOR = ' - ';

const KNOWN_REASONS = new Set<string>(CHANGE_REASONS);

export interface ParsedRejection {
	reasons: string[];
	comments: string;
}

export function buildRejectionReason(reasons: string[], comments: string): string {
	const details = comments.trim();
	if (reasons.length && details) {
		return `${reasons.join(REASON_SEPARATOR)}${COMMENTS_SEPARATOR}${details}`;
	}
	if (reasons.length) return reasons.join(REASON_SEPARATOR);
	return details;
}

function asKnownReasons(text: string): string[] | null {
	const parts = text.split(REASON_SEPARATOR);
	return parts.every((part) => KNOWN_REASONS.has(part)) ? parts : null;
}

/** Splits a stored rejection back into checklist reasons and free-text comments. */
export function parseRejectionReason(text: string): ParsedRejection {
	const trimmed = text.trim();

	const whole = asKnownReasons(trimmed);
	if (whole) return { reasons: whole, comments: '' };

	const splitAt = trimmed.indexOf(COMMENTS_SEPARATOR);
	if (splitAt > 0) {
		const reasons = asKnownReasons(trimmed.slice(0, splitAt));
		if (reasons) {
			return { reasons, comments: trimmed.slice(splitAt + COMMENTS_SEPARATOR.length).trim() };
		}
	}

	// Older or hand-written reasons that don't follow the form's format.
	return { reasons: [], comments: trimmed };
}
