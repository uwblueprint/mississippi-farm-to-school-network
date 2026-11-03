import { UserInputError } from 'apollo-server';
import { LOCKED_QUESTIONS } from '@/constants/defaultForm';
import { FormAnswers, FormAnswerValue, FormQuestion, FormQuestionType, FormSection } from '@/types';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;
const MAX_TEXT_LENGTH = 5000;

// Questions whose answers are also copied onto the farm's own fields, because
// the map filters, farm pages and admin table read those fields. Their ids are
// the field names (see DEFAULT_FORM_SECTIONS).
const CHECKBOX_FIELDS = [
  'growing_practices',
  'seasonal_products',
  'meat_products',
  'other_products',
  'food_safety_certifications',
  'farm_experiences',
  'farm_characteristics',
  'farm_to_school_sales',
] as const;
const TEXT_FIELDS = [
  'seasonal_products_detail',
  'meat_products_detail',
  'other_products_detail',
  'f2s_experience',
  'delivery_details',
  'website',
] as const;
const SOCIAL_QUESTIONS = {
  social_instagram: 'instagram',
  social_facebook: 'facebook',
  social_other: 'other',
} as const;

/** Question ids whose answers are copied onto a farm field (social ones onto social_media). */
export const LEGACY_QUESTION_IDS: ReadonlySet<string> = new Set([
  ...CHECKBOX_FIELDS,
  ...TEXT_FIELDS,
  'minimum_order',
  ...Object.keys(SOCIAL_QUESTIONS),
]);

export type LegacyFarmFields = Record<(typeof CHECKBOX_FIELDS)[number], string[]> &
  Record<(typeof TEXT_FIELDS)[number], string | null> & {
    minimum_order: number | null;
    // Only the keys the form manages; callers merge it into any existing social_media.
    social_media: Record<string, string>;
  };

export function allQuestions(sections: FormSection[]): FormQuestion[] {
  return sections.flatMap((section) => section.questions);
}

function text(value: unknown, field: string, required = false): string | null {
  if (value != null && typeof value !== 'string') {
    throw new UserInputError(`${field} must be text.`);
  }
  const trimmed = value?.trim() || null;
  if (required && !trimmed) throw new UserInputError(`${field} is required.`);
  if (trimmed && trimmed.length > MAX_TEXT_LENGTH)
    throw new UserInputError(`${field} is too long.`);
  return trimmed;
}

/**
 * Checks a form an admin is publishing and returns it in canonical form. Locked
 * questions are replaced by their fixed definitions, so they can never be
 * changed or dropped.
 */
export function normalizeFormSections(sections: FormSection[]): FormSection[] {
  if (!sections?.length) throw new UserInputError('The form needs at least one section.');

  const sectionIds = new Set<string>();
  const seen = new Map<string, FormQuestion>();
  const checkId = (id: string, ids: Set<string>) => {
    if (!ID_PATTERN.test(id ?? '') || ids.has(id)) {
      throw new UserInputError(`Id "${id}" is invalid or repeated.`);
    }
    ids.add(id);
  };
  const questionIds = new Set<string>();

  const normalized = sections.map((section) => {
    checkId(section.id, sectionIds);
    const questions = (section.questions ?? []).map((input): FormQuestion => {
      checkId(input.id, questionIds);
      const locked = Object.values(LOCKED_QUESTIONS).find((question) => question.id === input.id);
      if (locked || input.type === FormQuestionType.LOCKED) {
        if (!locked || input.lockedField !== locked.lockedField) {
          throw new UserInputError(`Question "${input.id}" is not a locked question.`);
        }
        seen.set(locked.id, locked);
        return locked;
      }

      const label = text(input.label, 'Question label', true)!;
      const question: FormQuestion = {
        id: input.id,
        type: input.type,
        label,
        required: Boolean(input.required),
        placeholder: text(input.placeholder, `"${label}" placeholder`),
        helpText: text(input.helpText, `"${label}" help text`),
        options: [],
        exclusiveOptionId: null,
        showIf: null,
        lockedField: null,
      };

      if (input.type === FormQuestionType.CHECKBOX) {
        const optionIds = new Set<string>();
        question.options = (input.options ?? []).map((option) => {
          if (!option.id || optionIds.has(option.id)) {
            throw new UserInputError(`"${label}" has a missing or repeated choice id.`);
          }
          optionIds.add(option.id);
          return { id: option.id, label: text(option.label, `A choice in "${label}"`, true)! };
        });
        if (optionIds.size === 0) throw new UserInputError(`"${label}" needs at least one choice.`);
        if (input.exclusiveOptionId != null && !optionIds.has(input.exclusiveOptionId)) {
          throw new UserInputError(`"${label}" marks a choice as exclusive that doesn't exist.`);
        }
        question.exclusiveOptionId = input.exclusiveOptionId ?? null;
      }

      if (input.showIf) {
        // Conditions may only point back at an earlier question, so they can't form a cycle.
        const target = seen.get(input.showIf.questionId);
        const optionIds = [...new Set(input.showIf.optionIds ?? [])];
        if (
          target?.type !== FormQuestionType.CHECKBOX ||
          optionIds.some((id) => !target.options.some((option) => option.id === id))
        ) {
          throw new UserInputError(
            `"${label}" depends on a question or choice that isn't above it.`
          );
        }
        question.showIf = { questionId: target.id, optionIds };
      }

      seen.set(question.id, question);
      return question;
    });

    return { id: section.id, title: text(section.title, 'Section title', true)!, questions };
  });

  const missing = Object.values(LOCKED_QUESTIONS).filter((question) => !seen.has(question.id));
  if (missing.length > 0) {
    throw new UserInputError(`The form must keep: ${missing.map((q) => q.label).join(', ')}.`);
  }
  return normalized;
}

function isEmptyAnswer(value: FormAnswerValue | undefined): boolean {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function isQuestionVisible(question: FormQuestion, answers: FormAnswers): boolean {
  if (!question.showIf) return true;
  const selected = answers[question.showIf.questionId];
  if (!Array.isArray(selected) || selected.length === 0) return false;
  const { optionIds } = question.showIf;
  return optionIds.length === 0 || optionIds.some((id) => selected.includes(id));
}

function cleanAnswer(question: FormQuestion, value: unknown): FormAnswerValue {
  const label = `"${question.label}"`;
  switch (question.type) {
    case FormQuestionType.CHECKBOX: {
      if (value == null) return null;
      const selected = Array.isArray(value) ? value : [value];
      const invalid = selected.filter((id) => !question.options.some((option) => option.id === id));
      if (invalid.length > 0) {
        throw new UserInputError(`${label} has choices that don't exist: ${invalid.join(', ')}`);
      }
      if (
        question.exclusiveOptionId &&
        selected.includes(question.exclusiveOptionId) &&
        selected.length > 1
      ) {
        throw new UserInputError(`${label} can't combine that choice with others.`);
      }
      // Stored in the form's option order, without duplicates.
      return question.options.map((option) => option.id).filter((id) => selected.includes(id));
    }
    case FormQuestionType.NUMBER: {
      if (value == null || value === '') return null;
      const number = Number(value);
      if (!Number.isInteger(number) || number < 0) {
        throw new UserInputError(`${label} must be a whole number.`);
      }
      return number;
    }
    default: {
      const answer = text(value, label);
      if (question.type === FormQuestionType.URL && answer && !URL_PATTERN.test(answer)) {
        throw new UserInputError(`${label} must be a valid URL.`);
      }
      return answer;
    }
  }
}

/**
 * Checks a farm's answers against the form version it's submitted on and returns
 * them cleaned up: trimmed, empty answers dropped, and answers to questions the
 * farmer couldn't see (their condition isn't met) dropped.
 */
export function validateAnswers(sections: FormSection[], answers: unknown): FormAnswers {
  if (answers == null || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new UserInputError('answers must be an object keyed by question id.');
  }
  const raw = answers as Record<string, unknown>;
  const questions = allQuestions(sections).filter((q) => q.type !== FormQuestionType.LOCKED);

  const unknown = Object.keys(raw).filter((id) => !questions.some((q) => q.id === id));
  if (unknown.length > 0) {
    throw new UserInputError(`Unknown questions in answers: ${unknown.join(', ')}`);
  }

  const cleaned: FormAnswers = {};
  const missing: string[] = [];
  for (const question of questions) {
    if (!isQuestionVisible(question, cleaned)) continue;
    const value = cleanAnswer(question, raw[question.id]);
    if (!isEmptyAnswer(value)) cleaned[question.id] = value;
    else if (question.required) missing.push(question.label);
  }
  if (missing.length > 0) throw new UserInputError(`Please answer: ${missing.join(', ')}`);
  return cleaned;
}

/** Copies the answers that back farm fields onto those fields. Checkbox fields store option labels. */
export function legacyFarmFields(sections: FormSection[], answers: FormAnswers): LegacyFarmFields {
  const questions = allQuestions(sections);
  const labelsOf = (id: string) => {
    const value = answers[id];
    const options = questions.find((question) => question.id === id)?.options ?? [];
    return Array.isArray(value)
      ? value.map((optionId) => options.find((o) => o.id === optionId)?.label ?? optionId)
      : [];
  };
  const textOf = (id: string) => (typeof answers[id] === 'string' ? (answers[id] as string) : null);

  const social_media: Record<string, string> = {};
  for (const [questionId, key] of Object.entries(SOCIAL_QUESTIONS)) {
    const value = textOf(questionId);
    if (value) social_media[key] = value;
  }

  return {
    ...(Object.fromEntries(CHECKBOX_FIELDS.map((id) => [id, labelsOf(id)])) as Record<
      (typeof CHECKBOX_FIELDS)[number],
      string[]
    >),
    ...(Object.fromEntries(TEXT_FIELDS.map((id) => [id, textOf(id)])) as Record<
      (typeof TEXT_FIELDS)[number],
      string | null
    >),
    minimum_order: typeof answers.minimum_order === 'number' ? answers.minimum_order : null,
    social_media,
  };
}

/** Rebuilds the answers of a farm created before form versions, from its own fields. */
export function answersFromLegacyFields(farm: {
  [field: string]: unknown;
  social_media?: Record<string, unknown> | null;
}): FormAnswers {
  const answers: FormAnswers = {};
  for (const id of [...CHECKBOX_FIELDS, ...TEXT_FIELDS, 'minimum_order']) {
    const value = farm[id] as FormAnswerValue | undefined;
    if (!isEmptyAnswer(value)) answers[id] = value!;
  }
  for (const [questionId, key] of Object.entries(SOCIAL_QUESTIONS)) {
    const value = farm.social_media?.[key];
    if (typeof value === 'string' && value) answers[questionId] = value;
  }
  return answers;
}
