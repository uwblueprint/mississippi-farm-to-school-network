// Mirrors the farmer form types in backend/types.ts (FormVersionDTO and friends).

export type FormQuestionType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'URL' | 'CHECKBOX' | 'LOCKED';

export type LockedFormField =
	| 'USDA_FARM_ID'
	| 'FARM_NAME'
	| 'FARM_ADDRESS'
	| 'COUNTY'
	| 'PRIMARY_PHONE'
	| 'PRIMARY_EMAIL'
	| 'PHOTOS';

export type FormOption = {
	id: string;
	label: string;
};

/** Shows a question once `questionId` has any of `optionIds` checked, or any option when empty. */
export type FormCondition = {
	questionId: string;
	optionIds: string[];
};

export type FormQuestion = {
	id: string;
	type: FormQuestionType;
	label: string;
	required: boolean;
	placeholder: string | null;
	helpText: string | null;
	options: FormOption[];
	/** A choice (e.g. "None of the above") that can't be combined with the others. */
	exclusiveOptionId: string | null;
	showIf: FormCondition | null;
	lockedField: LockedFormField | null;
};

export type FormSection = {
	id: string;
	title: string;
	questions: FormQuestion[];
};

export type FormVersion = {
	id: string;
	version: number;
	sections: FormSection[];
	createdBy: string | null;
	createdAt: string;
};

/** TEXT/TEXTAREA/URL hold a string, NUMBER a number, CHECKBOX the checked option ids. */
export type FormAnswerValue = string | number | string[] | null;
export type FormAnswers = Record<string, FormAnswerValue>;
