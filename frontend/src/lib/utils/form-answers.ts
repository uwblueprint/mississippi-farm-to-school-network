// Client-side mirror of backend/utilities/formAnswers.ts, for showing errors as the farmer types.
import type {
	FormAnswers,
	FormAnswerValue,
	FormQuestion,
	FormSection,
	FormVersion
} from '$lib/types/form';

export const FORM_VERSION_FIELDS = `
	id
	version
	createdBy
	createdAt
	sections {
		id
		title
		questions {
			id
			type
			label
			required
			placeholder
			helpText
			options {
				id
				label
			}
			exclusiveOptionId
			showIf {
				questionId
				optionIds
			}
			lockedField
		}
	}
`;

export const PUBLISHED_FORM_QUERY = `
	query PublishedForm {
		publishedForm {${FORM_VERSION_FIELDS}
		}
	}
`;

type TypedAnswerType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'URL';

/** Example text shown inside an answer box when the question has none of its own. */
export const DEFAULT_PLACEHOLDERS: Record<TypedAnswerType, string> = {
	TEXT: 'Enter words, e.g. a short answer',
	TEXTAREA: 'Enter a few words or sentences',
	NUMBER: 'Enter a number, e.g. 25',
	URL: 'Enter a website link, e.g. https://example.com'
};

/** The question's own example text, or the default for its answer type. */
export function placeholderFor(question: FormQuestion): string {
	return (
		question.placeholder?.trim() || DEFAULT_PLACEHOLDERS[question.type as TypedAnswerType] || ''
	);
}

/** True for the section that holds the Photos question. */
export function isPhotosSection(section: FormSection): boolean {
	return section.questions.some((question) => question.lockedField === 'PHOTOS');
}

/**
 * Puts the Photos question last, alone in its own section at the end of the form. Any
 * other questions in its section move to the end of the section before it, keeping their
 * order. Mirrors photosLast in backend/utilities/formAnswers.ts, which applies it on save;
 * this also fixes versions saved before that rule existed.
 */
export function photosLast(sections: FormSection[]): FormSection[] {
	const index = sections.findIndex(isPhotosSection);
	if (index === -1) return sections;

	const photosSection = sections[index];
	const photos = photosSection.questions.find((question) => question.lockedField === 'PHOTOS')!;
	const others = photosSection.questions.filter((question) => question.lockedField !== 'PHOTOS');
	const rest = sections.filter((_, i) => i !== index);

	if (others.length > 0) {
		if (rest.length === 0) {
			rest.push({ id: `${photosSection.id}_questions`, title: 'Other Details', questions: others });
		} else {
			const target = Math.max(index - 1, 0);
			rest[target] = { ...rest[target], questions: [...rest[target].questions, ...others] };
		}
	}
	return [...rest, { ...photosSection, questions: [photos] }];
}

const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

export function allQuestions(form: FormVersion): FormQuestion[] {
	return form.sections.flatMap((section) => section.questions);
}

export function answerableQuestions(form: FormVersion): FormQuestion[] {
	return allQuestions(form).filter((question) => question.type !== 'LOCKED');
}

export function displayLabel(question: FormQuestion): string {
	return question.required ? question.label : `Optional: ${question.label}`;
}

export function isEmptyAnswer(value: FormAnswerValue | undefined): boolean {
	if (value == null) return true;
	if (Array.isArray(value)) return value.length === 0;
	return typeof value === 'string' && value.trim() === '';
}

export function isQuestionVisible(question: FormQuestion, answers: FormAnswers): boolean {
	if (!question.showIf) return true;
	const selected = answers[question.showIf.questionId];
	if (!Array.isArray(selected) || selected.length === 0) return false;
	return (
		question.showIf.optionIds.length === 0 ||
		question.showIf.optionIds.some((id) => selected.includes(id))
	);
}

/** Checks or unchecks a choice, keeping the exclusive choice (e.g. "None of the above") on its own. */
export function toggleOption(
	question: FormQuestion,
	current: FormAnswerValue | undefined,
	optionId: string,
	checked: boolean
): string[] {
	const selected = Array.isArray(current) ? current : [];
	if (!checked) return selected.filter((id) => id !== optionId);
	if (optionId === question.exclusiveOptionId) return [optionId];
	return [...selected.filter((id) => id !== question.exclusiveOptionId), optionId];
}

/** Error message per answerable question, '' when it's fine. Hidden questions never error. */
export function answerErrors(form: FormVersion, answers: FormAnswers): Record<string, string> {
	const errors: Record<string, string> = {};
	// Visibility follows the answers that would be sent, so a stale answer left on
	// a now-hidden question can't reveal the questions that depend on it.
	const shown = answersPayload(form, answers);
	for (const question of answerableQuestions(form)) {
		const value = answers[question.id];
		let message = '';
		if (!isQuestionVisible(question, shown)) {
			message = '';
		} else if (isEmptyAnswer(value)) {
			if (question.required) {
				message =
					question.type === 'CHECKBOX' ? 'Select at least one option.' : 'This field is required.';
			}
		} else if (question.type === 'URL' && !URL_PATTERN.test(String(value).trim())) {
			message = 'Enter a valid URL.';
		} else if (question.type === 'NUMBER' && !Number.isInteger(Number(value))) {
			message = 'Enter a whole number.';
		}
		errors[question.id] = message;
	}
	return errors;
}

/**
 * The answers to send: only questions the farmer can see, with text trimmed and
 * empty answers left out. Numbers typed as text are sent as numbers.
 */
export function answersPayload(form: FormVersion, answers: FormAnswers): FormAnswers {
	const payload: FormAnswers = {};
	for (const question of answerableQuestions(form)) {
		const value = answers[question.id];
		if (!isQuestionVisible(question, payload) || isEmptyAnswer(value)) continue;
		if (question.type === 'NUMBER') payload[question.id] = Number(value);
		else if (typeof value === 'string') payload[question.id] = value.trim();
		else payload[question.id] = value;
	}
	return payload;
}

export function optionLabels(question: FormQuestion, value: FormAnswerValue | undefined): string[] {
	if (!Array.isArray(value)) return [];
	return value.map((id) => question.options.find((option) => option.id === id)?.label ?? id);
}
