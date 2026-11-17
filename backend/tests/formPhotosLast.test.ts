import { DEFAULT_FORM_SECTIONS } from '@/constants/defaultForm';
import { FormQuestion, FormQuestionType, FormSection } from '@/types';
import { photosLast } from '@/utilities/formAnswers';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

import FormService from '@/services/implementations/formService';

const textQuestion = (id: string, label = id, extra: Partial<FormQuestion> = {}): FormQuestion => ({
  id,
  type: FormQuestionType.TEXT,
  label,
  required: false,
  placeholder: null,
  helpText: null,
  options: [],
  exclusiveOptionId: null,
  showIf: null,
  lockedField: null,
  ...extra,
});

/** Last item (the backend's TS target has no Array.prototype.at). */
const last = <T>(items: T[]): T => items[items.length - 1];

const ids = (sections: FormSection[]) =>
  sections.map((section) => [section.id, section.questions.map((question) => question.id)]);

/** The default form with these questions added to the Photos section, below the upload. */
const withQuestionsUnderPhotos = (...questions: FormQuestion[]): FormSection[] =>
  DEFAULT_FORM_SECTIONS.map((section) =>
    section.id === 'photos'
      ? { ...section, questions: [...section.questions, ...questions] }
      : section
  );

describe('photosLast', () => {
  test('leaves the default form unchanged', () => {
    expect(photosLast(DEFAULT_FORM_SECTIONS)).toEqual(DEFAULT_FORM_SECTIONS);
  });

  test('moves questions added under Photos to the end of the section before it', () => {
    const result = photosLast(
      withQuestionsUnderPhotos(textQuestion('q_test'), textQuestion('q_another'))
    );

    expect(result.map((section) => section.id)).toEqual(
      DEFAULT_FORM_SECTIONS.map((section) => section.id)
    );
    const otherDetails = result.find((section) => section.id === 'other_details')!;
    expect(otherDetails.questions.slice(-2).map((q) => q.id)).toEqual(['q_test', 'q_another']);
    expect(last(result)).toMatchObject({ id: 'photos', questions: [{ id: 'photos' }] });
  });

  test('moves questions placed above Photos in its section too', () => {
    const sections = DEFAULT_FORM_SECTIONS.map((section) =>
      section.id === 'photos'
        ? { ...section, questions: [textQuestion('q_before'), ...section.questions] }
        : section
    );

    const result = photosLast(sections);

    expect(last(result).questions.map((q) => q.id)).toEqual(['photos']);
    expect(last(result[result.length - 2].questions).id).toBe('q_before');
  });

  test('moves the Photos section to the end when it is not last', () => {
    const photos = DEFAULT_FORM_SECTIONS.find((section) => section.id === 'photos')!;
    const sections = [
      photos,
      ...DEFAULT_FORM_SECTIONS.filter((section) => section.id !== 'photos'),
    ];

    const result = photosLast(sections);

    expect(result.map((section) => section.id)).toEqual(
      DEFAULT_FORM_SECTIONS.map((section) => section.id)
    );
  });

  test('keeps every other question in the same relative order', () => {
    const before = withQuestionsUnderPhotos(textQuestion('q_test'), textQuestion('q_another'));
    const order = (sections: FormSection[]) =>
      sections
        .flatMap((section) => section.questions.map((q) => q.id))
        .filter((id) => id !== 'photos');

    expect(order(photosLast(before))).toEqual(order(before));
  });

  test('gives other questions their own section when Photos shared the only section', () => {
    const result = photosLast([
      {
        id: 'only',
        title: 'Everything',
        questions: [
          ...DEFAULT_FORM_SECTIONS.find((section) => section.id === 'photos')!.questions,
          textQuestion('q_test'),
        ],
      },
    ]);

    expect(ids(result)).toEqual([
      ['only_questions', ['q_test']],
      ['only', ['photos']],
    ]);
  });

  test('does nothing to a form without a Photos question', () => {
    const sections = [{ id: 'a', title: 'A', questions: [textQuestion('q1')] }];
    expect(photosLast(sections)).toBe(sections);
  });

  test('does not change its input', () => {
    const input = withQuestionsUnderPhotos(textQuestion('q_test'));
    const copy = JSON.parse(JSON.stringify(input));

    photosLast(input);

    expect(input).toEqual(copy);
  });
});

describe('saving a form with questions under Photos', () => {
  let forms: FormService;

  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    forms = new FormService();
  });

  test('publishes it with Photos as the last question', async () => {
    const v1 = await forms.getPublishedForm();

    const v2 = await forms.saveForm(
      'admin-1',
      v1.id,
      withQuestionsUnderPhotos(textQuestion('q_test', 'test question', { required: true }), {
        ...textQuestion('q_another', 'another test question'),
        type: FormQuestionType.TEXTAREA,
      })
    );

    const allIds = v2.sections.flatMap((section) => section.questions.map((q) => q.id));
    expect(last(allIds)).toBe('photos');
    expect(last(v2.sections).questions.map((q) => q.id)).toEqual(['photos']);
    expect(allIds.slice(-3, -1)).toEqual(['q_test', 'q_another']);
  });

  test('stores it that way, so the next read has Photos last too', async () => {
    const v1 = await forms.getPublishedForm();
    await forms.saveForm('admin-1', v1.id, withQuestionsUnderPhotos(textQuestion('q_test')));

    const latest = await forms.getPublishedForm();

    expect(last(latest.sections).questions.map((q) => q.id)).toEqual(['photos']);
  });

  test('accepts a condition on a question moved out of the Photos section', async () => {
    const v1 = await forms.getPublishedForm();

    await expect(
      forms.saveForm(
        'admin-1',
        v1.id,
        withQuestionsUnderPhotos(
          {
            ...textQuestion('q_kind', 'Kind'),
            type: FormQuestionType.CHECKBOX,
            options: [{ id: 'a', label: 'A' }],
          },
          textQuestion('q_detail', 'Detail', { showIf: { questionId: 'q_kind', optionIds: [] } })
        )
      )
    ).resolves.toMatchObject({ version: 2 });
  });
});
