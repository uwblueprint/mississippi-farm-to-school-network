import { DEFAULT_FORM_SECTIONS } from '@/constants/defaultForm';
import { CreateFarmInput, FormQuestionType, FormSection, Role } from '@/types';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => ({ sendEmail: jest.fn().mockResolvedValue(undefined) })),
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getUserByFirebaseUid: jest.fn().mockResolvedValue({
      id: 'owner-1',
      email: 'owner@example.com',
      role: Role.FARMER,
      firstName: 'Owner',
    }),
  })),
}));

import FarmService from '@/services/implementations/farmService';
import FormService from '@/services/implementations/formService';

const baseInput: CreateFarmInput = {
  farm_name: 'Test Farm',
  primary_phone: '6015550100',
  primary_email: 'farm@example.com',
  farm_address: '123 Farm Rd',
  usda_farm_id: 'usda-1',
  county: 'Hinds',
  location: { lat: 32.3, lng: -90.18 },
  formVersionId: 'v1',
  answers: {
    growing_practices: ['Conventional'],
    food_safety_certifications: ['None of the above'],
  },
};

/** The default form plus a required text question at the end of "Other Details". */
function withNewQuestion(): FormSection[] {
  return DEFAULT_FORM_SECTIONS.map((section) =>
    section.id === 'other_details'
      ? {
          ...section,
          questions: [
            ...section.questions,
            {
              id: 'q_acreage',
              type: FormQuestionType.TEXT,
              label: 'How many acres do you farm?',
              required: true,
              placeholder: null,
              helpText: null,
              options: [],
              exclusiveOptionId: null,
              showIf: null,
              lockedField: null,
            },
          ],
        }
      : section
  );
}

describe('FormService', () => {
  let forms: FormService;
  let farms: FarmService;

  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    forms = new FormService();
    farms = new FarmService();
  });

  test('publishedForm seeds version 1 from the current farmer form', async () => {
    const form = await forms.getPublishedForm();
    expect(form).toMatchObject({ id: 'v1', version: 1, sections: DEFAULT_FORM_SECTIONS });
  });

  test('saveForm publishes a new version and keeps the old one', async () => {
    const saved = await forms.saveForm('admin-1', 'v1', withNewQuestion());

    expect(saved).toMatchObject({ id: 'v2', version: 2, createdBy: 'admin-1' });
    expect((await forms.getPublishedForm()).id).toBe('v2');
    expect((await forms.getFormVersion('v1')).sections).toEqual(DEFAULT_FORM_SECTIONS);
  });

  test('saveForm rejects an edit of a version that is no longer the latest', async () => {
    await forms.saveForm('admin-1', 'v1', withNewQuestion());
    await expect(forms.saveForm('admin-2', 'v1', DEFAULT_FORM_SECTIONS)).rejects.toThrow(
      'newer version'
    );
  });

  test('saveForm rejects a form missing a locked question', async () => {
    const sections = DEFAULT_FORM_SECTIONS.map((section) => ({
      ...section,
      questions: section.questions.filter((question) => question.id !== 'county'),
    }));
    await expect(forms.saveForm('admin-1', 'v1', sections)).rejects.toThrow('County');
  });

  test('saveForm ignores edits to a locked question', async () => {
    const sections = DEFAULT_FORM_SECTIONS.map((section) => ({
      ...section,
      questions: section.questions.map((question) =>
        question.id === 'farm_name' ? { ...question, label: 'Renamed', required: false } : question
      ),
    }));
    const saved = await forms.saveForm('admin-1', 'v1', sections);
    const farmName = saved.sections[0].questions.find((question) => question.id === 'farm_name');
    expect(farmName).toMatchObject({ label: 'Farm Name', required: true });
  });

  test('saveForm rejects a condition on a choice that does not exist', async () => {
    const sections = DEFAULT_FORM_SECTIONS.map((section) => ({
      ...section,
      questions: section.questions.map((question) =>
        question.id === 'delivery_details'
          ? { ...question, showIf: { questionId: 'farm_to_school_sales', optionIds: ['Nope'] } }
          : question
      ),
    }));
    await expect(forms.saveForm('admin-1', 'v1', sections)).rejects.toThrow("isn't above it");
  });

  describe('createFarm against the form', () => {
    test('fills the farm fields from the answers', async () => {
      const farm = await farms.createFarm('owner-1', {
        ...baseInput,
        answers: {
          ...baseInput.answers,
          farm_to_school_sales: ['Delivery Available'],
          f2s_experience: '  Two years with Jackson schools ',
          minimum_order: 30,
          delivery_details: 'Within 20 miles',
          social_instagram: '@farm',
        },
      });

      expect(farm).toMatchObject({
        formVersionId: 'v1',
        growing_practices: ['Conventional'],
        farm_to_school_sales: ['Delivery Available'],
        f2s_experience: 'Two years with Jackson schools',
        minimum_order: 30,
        delivery_details: 'Within 20 miles',
        social_media: { instagram: '@farm' },
      });
      expect(farm.answers.f2s_experience).toBe('Two years with Jackson schools');
    });

    test('rejects a missing required answer', async () => {
      await expect(
        farms.createFarm('owner-1', {
          ...baseInput,
          answers: { growing_practices: ['Conventional'] },
        })
      ).rejects.toThrow('Food Safety & Certifications');
    });

    test('rejects a required answer whose condition is met but left empty', async () => {
      await expect(
        farms.createFarm('owner-1', {
          ...baseInput,
          answers: { ...baseInput.answers, farm_to_school_sales: ['Delivery Available'] },
        })
      ).rejects.toThrow('Delivery details');
    });

    test('rejects a choice that is not an option', async () => {
      await expect(
        farms.createFarm('owner-1', {
          ...baseInput,
          answers: { ...baseInput.answers, meat_products: ['Bison'] },
        })
      ).rejects.toThrow("don't exist: Bison");
    });

    test('rejects a submission on a version that is not the latest', async () => {
      await forms.saveForm('admin-1', 'v1', withNewQuestion());
      await expect(farms.createFarm('owner-1', baseInput)).rejects.toThrow('form has been updated');
    });

    test('a new required question must be answered on the new version', async () => {
      await forms.saveForm('admin-1', 'v1', withNewQuestion());
      const input = { ...baseInput, formVersionId: 'v2' };

      await expect(farms.createFarm('owner-1', input)).rejects.toThrow('How many acres');

      const farm = await farms.createFarm('owner-1', {
        ...input,
        answers: { ...input.answers, q_acreage: '40' },
      });
      expect(farm.formVersionId).toBe('v2');
      expect(farm.answers.q_acreage).toBe('40');
    });
  });

  describe('updating a farm submitted on an older version', () => {
    test('validates answers against the farm’s own version', async () => {
      const farm = await farms.createFarm('owner-1', baseInput);
      await forms.saveForm('admin-1', 'v1', withNewQuestion());

      // Not required (or even known) on v1, so an edit doesn't need it.
      const updated = await farms.updateFarm(
        farm.id,
        { answers: { ...baseInput.answers, meat_products: ['Beef'] } },
        false
      );
      expect(updated).toMatchObject({ formVersionId: 'v1', meat_products: ['Beef'] });

      await expect(
        farms.updateFarm(farm.id, { answers: { ...baseInput.answers, q_acreage: '40' } }, false)
      ).rejects.toThrow('Unknown questions');
    });

    test('keeps social media keys the form does not manage', async () => {
      const farm = await farms.createFarm('owner-1', baseInput);
      await farms.updateFarm(farm.id, { social_media: { youtube: 'farm-tv' } }, true);

      const updated = await farms.updateFarm(
        farm.id,
        { answers: { ...baseInput.answers, social_facebook: 'fb.com/farm' } },
        false
      );
      expect(updated.social_media).toEqual({ youtube: 'farm-tv', facebook: 'fb.com/farm' });
    });
  });

  test('farms created before form versions read as version 1 with answers from their fields', async () => {
    await mockFirestoreInstance
      .collection('farms')
      .doc('legacy')
      .set({
        owner_user_id: 'owner-1',
        farm_name: 'Old Farm',
        location: { lat: 32, lng: -90 },
        growing_practices: ['Regenerative'],
        food_safety_certifications: ['GAP Certified'],
        seasonal_products: [],
        website: 'oldfarm.com',
        social_media: { instagram: '@old' },
        minimum_order: null,
        status: 'APPROVED',
        is_archived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

    const farm = await farms.getFarmById('legacy');
    expect(farm.formVersionId).toBe('v1');
    expect(farm.answers).toEqual({
      growing_practices: ['Regenerative'],
      food_safety_certifications: ['GAP Certified'],
      website: 'oldfarm.com',
      social_instagram: '@old',
    });
  });
});
