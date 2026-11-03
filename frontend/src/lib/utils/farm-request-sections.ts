import type { PendingFarmDto } from '$lib/types/admin';
import type { MarketSalesData } from '$lib/types/farm';
import {
	answerableQuestions,
	isEmptyAnswer,
	isQuestionVisible,
	optionLabels
} from '$lib/utils/form-answers';

export type ReviewField =
	| { kind: 'text'; label?: string; value: string | null | undefined }
	| { kind: 'list'; label?: string; values: string[] | null | undefined };

export type ReviewSection = {
	id: string;
	title: string;
	fields: ReviewField[];
};

const CONTACT_CARD_QUESTION_IDS = new Set(['website', 'social_instagram', 'social_facebook']);

function nonEmptyText(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function nonEmptyList(values: string[] | null | undefined): string[] | null {
	if (!values?.length) return null;
	return values;
}

/** Build review sections from the farm's own form version; empty fields/sections are omitted. */
export function buildReviewSections(farm: PendingFarmDto): ReviewSection[] {
	const form = farm.formVersion;
	const answers = farm.answers ?? {};
	const answerable = new Set(answerableQuestions(form).map((question) => question.id));

	const sections: ReviewSection[] = form.sections.map((section) => ({
		id: section.id,
		title: section.title,
		fields: section.questions
			.filter(
				(question) =>
					answerable.has(question.id) &&
					!CONTACT_CARD_QUESTION_IDS.has(question.id) &&
					isQuestionVisible(question, answers) &&
					!isEmptyAnswer(answers[question.id])
			)
			.map((question): ReviewField => {
				const value = answers[question.id];
				if (question.type === 'CHECKBOX') {
					return { kind: 'list', label: question.label, values: optionLabels(question, value) };
				}
				return { kind: 'text', label: question.label, value: String(value) };
			})
	}));

	// Not a form question, but older farms may have it.
	if (farm.market_sales_data?.length) {
		sections.push({
			id: 'market_sales',
			title: 'Market Sales',
			fields: [
				{
					kind: 'text',
					value: farm.market_sales_data
						.map((entry: MarketSalesData) => `${entry.market} (${entry.times})`)
						.join('; ')
				}
			]
		});
	}

	return sections
		.map((section) => ({
			...section,
			fields: section.fields.filter((field) => {
				if (field.kind === 'list') return Boolean(nonEmptyList(field.values));
				return Boolean(nonEmptyText(field.value));
			})
		}))
		.filter((section) => section.fields.length > 0);
}
