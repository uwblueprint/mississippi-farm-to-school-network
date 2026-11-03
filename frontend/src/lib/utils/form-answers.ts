// Client-side mirror of backend/utilities/formAnswers.ts, for showing errors as the farmer types.
import type { FormAnswers, FormAnswerValue, FormQuestion, FormVersion } from '$lib/types/form';

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
