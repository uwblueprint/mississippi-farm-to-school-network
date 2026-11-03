import {
  FARM_CHARACTERISTICS,
  FARM_EXPERIENCES,
  FARM_TO_SCHOOL_SALES,
  FOOD_SAFETY_CERTIFICATIONS,
  GROWING_PRACTICES,
  MEAT_PRODUCTS,
  NONE_OF_THE_ABOVE,
  OTHER_PRODUCTS,
  SEASONAL_PRODUCTS,
} from '@/constants/farmOptions';
import { FormOption, FormQuestion, FormQuestionType, FormSection, LockedFormField } from '@/types';

/** Doc id of the first form version, which every farm created before versioning points at. */
export const INITIAL_FORM_VERSION_ID = 'v1';

// Version 1 is the farmer form as it was hardcoded before admins could edit it.
// Question ids are the farm fields they used to fill, and option ids are the
// option labels farms already store, so existing farms' answers map onto it
// without renaming anything.

const options = (labels: readonly string[]): FormOption[] =>
  labels.map((label) => ({ id: label, label }));

const question = (
  fields: Pick<FormQuestion, 'id' | 'type' | 'label'> & Partial<FormQuestion>
): FormQuestion => ({
  required: false,
  placeholder: null,
  helpText: null,
  options: [],
  exclusiveOptionId: null,
  showIf: null,
  lockedField: null,
  ...fields,
});

const locked = (
  lockedField: LockedFormField,
  label: string,
  fields: Partial<FormQuestion> = {}
): FormQuestion =>
  question({
    id: lockedField.toLowerCase(),
    type: FormQuestionType.LOCKED,
    label,
    required: true,
    lockedField,
    ...fields,
  });

/** The fixed questions every form version must contain, in their canonical form. */
export const LOCKED_QUESTIONS: Record<LockedFormField, FormQuestion> = {
  [LockedFormField.USDA_FARM_ID]: locked(LockedFormField.USDA_FARM_ID, 'Farm ID #', {
    placeholder: 'e.g. 32486126374',
  }),
  [LockedFormField.FARM_NAME]: locked(LockedFormField.FARM_NAME, 'Farm Name', {
    placeholder: 'e.g. Two Brooks Farm',
  }),
  [LockedFormField.FARM_ADDRESS]: locked(LockedFormField.FARM_ADDRESS, 'Farm address', {
    placeholder: 'Search Farm Address',
  }),
  [LockedFormField.COUNTY]: locked(LockedFormField.COUNTY, 'County', {
    placeholder: 'Start typing your county',
  }),
  [LockedFormField.PRIMARY_PHONE]: locked(LockedFormField.PRIMARY_PHONE, 'Phone Number', {
    placeholder: '10 digit number',
  }),
  [LockedFormField.PRIMARY_EMAIL]: locked(LockedFormField.PRIMARY_EMAIL, 'Email Address', {
    placeholder: 'e.g. name@email.com',
  }),
  [LockedFormField.PHOTOS]: locked(LockedFormField.PHOTOS, 'Photos', {
    required: false,
    helpText:
      'Optional: Upload photos of your farm, operations, and/or products here for people to see when they look at your farm up to 10 pics! Click a photo to make it your cover photo on the dashboard view.',
  }),
};

const DELIVERY_AVAILABLE = 'Delivery Available';

export const DEFAULT_FORM_SECTIONS: FormSection[] = [
  {
    id: 'farm_basics',
    title: 'Farm Basics',
    questions: [
      LOCKED_QUESTIONS[LockedFormField.USDA_FARM_ID],
      LOCKED_QUESTIONS[LockedFormField.FARM_NAME],
      LOCKED_QUESTIONS[LockedFormField.FARM_ADDRESS],
      LOCKED_QUESTIONS[LockedFormField.COUNTY],
    ],
  },
  {
    id: 'primary_contact',
    title: 'Primary Contact Information',
    questions: [
      LOCKED_QUESTIONS[LockedFormField.PRIMARY_PHONE],
      LOCKED_QUESTIONS[LockedFormField.PRIMARY_EMAIL],
      question({
        id: 'social_instagram',
        type: FormQuestionType.TEXT,
        label: 'Instagram',
        placeholder: 'e.g. @twobrooksfarm',
      }),
      question({
        id: 'social_facebook',
        type: FormQuestionType.TEXT,
        label: 'Facebook',
        placeholder: 'e.g. facebook.com/twobrooksfarm',
      }),
      question({
        id: 'website',
        type: FormQuestionType.URL,
        label: 'Website',
        placeholder: 'e.g. https://twobrooksfarm.com',
      }),
      question({
        id: 'social_other',
        type: FormQuestionType.TEXT,
        label: 'Other (social media + username)',
        placeholder: 'e.g. X: @twobrooksfarm',
      }),
    ],
  },
  {
    id: 'farm_profile',
    title: 'Farm Profile',
    questions: [
      question({
        id: 'growing_practices',
        type: FormQuestionType.CHECKBOX,
        label: 'Growing Practices',
        required: true,
        options: options(GROWING_PRACTICES),
        exclusiveOptionId: NONE_OF_THE_ABOVE,
      }),
    ],
  },
  {
    id: 'products_offered',
    title: 'Products offered',
    questions: [
      question({
        id: 'seasonal_products',
        type: FormQuestionType.CHECKBOX,
        label: 'Seasonal product and products offered',
        options: options(SEASONAL_PRODUCTS),
      }),
      question({
        id: 'seasonal_products_detail',
        type: FormQuestionType.TEXTAREA,
        label: 'List each fruit, vegetable, herb, or dairy product offered',
        placeholder: 'Example: tomatoes, zucchini, basil, kale, strawberries, eggs',
        showIf: { questionId: 'seasonal_products', optionIds: [] },
      }),
      question({
        id: 'meat_products',
        type: FormQuestionType.CHECKBOX,
        label: 'Meat',
        options: options(MEAT_PRODUCTS),
      }),
      question({
        id: 'meat_products_detail',
        type: FormQuestionType.TEXTAREA,
        label: 'List each meat product offered',
        placeholder: 'Example: ground beef, whole chicken, pork chops, catfish',
        showIf: { questionId: 'meat_products', optionIds: [] },
      }),
      question({
        id: 'other_products',
        type: FormQuestionType.CHECKBOX,
        label: 'Other',
        options: options(OTHER_PRODUCTS),
      }),
      question({
        id: 'other_products_detail',
        type: FormQuestionType.TEXTAREA,
        label: 'List each other product offered',
        placeholder: 'Example: honey, shiitake mushrooms, sunflowers, seedlings',
        showIf: { questionId: 'other_products', optionIds: [] },
      }),
    ],
  },
  {
    id: 'other_details',
    title: 'Other Details',
    questions: [
      question({
        id: 'food_safety_certifications',
        type: FormQuestionType.CHECKBOX,
        label: 'Food Safety & Certifications',
        required: true,
        options: options(FOOD_SAFETY_CERTIFICATIONS),
        exclusiveOptionId: NONE_OF_THE_ABOVE,
      }),
      question({
        id: 'farm_experiences',
        type: FormQuestionType.CHECKBOX,
        label: 'Farm Experiences & Services',
        options: options(FARM_EXPERIENCES),
      }),
      question({
        id: 'farm_characteristics',
        type: FormQuestionType.CHECKBOX,
        label: 'Farm Characteristics',
        options: options(FARM_CHARACTERISTICS),
      }),
      question({
        id: 'farm_to_school_sales',
        type: FormQuestionType.CHECKBOX,
        label: 'Farm to School Sales',
        options: options(FARM_TO_SCHOOL_SALES),
      }),
      question({
        id: 'f2s_experience',
        type: FormQuestionType.TEXTAREA,
        label: 'Previous Farm to School or ECE experience',
        required: true,
        placeholder: 'N/A',
        showIf: { questionId: 'farm_to_school_sales', optionIds: [] },
      }),
      question({
        id: 'minimum_order',
        type: FormQuestionType.NUMBER,
        label: 'Minimum order for schools/ECEs',
        required: true,
        placeholder: '30',
        showIf: { questionId: 'farm_to_school_sales', optionIds: [] },
      }),
      question({
        id: 'delivery_details',
        type: FormQuestionType.TEXTAREA,
        label: 'Delivery details (area, fees, minimums)',
        required: true,
        placeholder: 'Minimum order amount of $30',
        showIf: { questionId: 'farm_to_school_sales', optionIds: [DELIVERY_AVAILABLE] },
      }),
    ],
  },
  {
    id: 'photos',
    title: 'Optional: Photos',
    questions: [LOCKED_QUESTIONS[LockedFormField.PHOTOS]],
  },
];
