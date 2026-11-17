import { ForbiddenError } from 'apollo-server';
import { DEFAULT_FORM_SECTIONS } from '@/constants/defaultForm';
import { CreateFarmInput, FarmStatus, FormQuestionType, Role } from '@/types';
import type { AuthContext } from '@/middlewares/auth';
import { FakeFirestore } from './helpers/fakeFirestore';

// The admin create flow (#129) running against the versioned farmer form (#131): the
// real FarmService and FormService on a fake Firestore, with accounts and email mocked.

let mockFirestoreInstance: FakeFirestore;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

const mockRequireRole = jest.fn();
const mockGetOrCreateFarmerByEmail = jest.fn();
const mockSendFarmAddedEmail = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: {
    requireAuth: jest.fn(),
    requireEmailVerified: jest.fn(),
    requireRole: mockRequireRole,
    requireOwnerOrAdmin: jest.fn(),
  },
}));

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getOrCreateFarmerByEmail: mockGetOrCreateFarmerByEmail,
    getUserByFirebaseUid: jest.fn(),
  })),
}));

jest.mock('@/services/implementations/authService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendFarmAddedEmail: mockSendFarmAddedEmail,
  })),
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ sendEmail: mockSendEmail })),
}));

jest.mock('@/services/implementations/fileStorageService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ deleteFile: jest.fn() })),
}));

import farmResolvers from '@/graphql/resolvers/farmResolvers';
import FarmService from '@/services/implementations/farmService';
import FormService from '@/services/implementations/formService';

type CreateResult = {
  farm: { id: string; owner_user_id: string; status: FarmStatus };
  emailSent: boolean;
  needsPasswordSetup: boolean;
};

const createFarmForFarmer = farmResolvers.Mutation.createFarmForFarmer as (
  parent: undefined,
  args: { email: string; input: CreateFarmInput },
  context: AuthContext
) => Promise<CreateResult>;

const context = { firebaseUid: 'admin-uid' } as AuthContext;

const validInput = (overrides: Partial<CreateFarmInput> = {}): CreateFarmInput => ({
  usda_farm_id: 'usda-1',
  farm_name: 'Two Brooks Farm',
  primary_phone: '6015550100',
  primary_email: 'farmer@example.com',
  farm_address: '123 Farm Rd, Jackson, MS',
  county: 'Hinds',
  location: { lat: 32.3, lng: -90.18 },
  formVersionId: 'v1',
  answers: {
    growing_practices: ['Conventional'],
    food_safety_certifications: ['None of the above'],
    seasonal_products: ['Fruits and Vegetables'],
    seasonal_products_detail: 'peaches, strawberries',
    social_instagram: '@twobrooks',
    website: 'https://twobrooks.farm',
  },
  ...overrides,
});

const newFarmer = (uid = 'farmer-uid', needsPasswordSetup = true) => ({
  user: {
    id: uid,
    firebase_uid: uid,
    email: 'farmer@example.com',
    role: Role.FARMER,
    is_verified: true,
    firstName: null,
    lastName: null,
    phone: null,
  },
  needsPasswordSetup,
});

const storedFarms = async (): Promise<Array<Record<string, unknown>>> =>
  (await mockFirestoreInstance.collection('farms').get()).docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  }));

/** Publishes a new form version with one extra required text question. */
async function publishVersionWithRequiredQuestion() {
  const formService = new FormService();
  const v1 = await formService.getPublishedForm();
  return formService.saveForm(
    'admin-uid',
    v1.id,
    DEFAULT_FORM_SECTIONS.map((section) =>
      section.id === 'other_details'
        ? {
            ...section,
            questions: [
              ...section.questions,
              {
                id: 'q_acreage',
                type: FormQuestionType.TEXT,
                label: 'Acres farmed',
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
    )
  );
}

describe('createFarmForFarmer with the versioned farmer form', () => {
  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    mockRequireRole.mockReset().mockResolvedValue({ id: 'admin-uid', role: Role.ADMIN });
    mockGetOrCreateFarmerByEmail.mockReset().mockResolvedValue(newFarmer());
    mockSendFarmAddedEmail.mockReset().mockResolvedValue(undefined);
    mockSendEmail.mockReset().mockResolvedValue(undefined);
  });

  describe('a valid farm on the published form', () => {
    test('is created for the farmer, pending, on the form version it was filled in on', async () => {
      const result = await createFarmForFarmer(
        undefined,
        { email: 'farmer@example.com', input: validInput() },
        context
      );

      expect(result).toMatchObject({
        farm: { owner_user_id: 'farmer-uid', status: FarmStatus.PENDING_APPROVAL },
        emailSent: true,
        needsPasswordSetup: true,
      });
      const [stored] = await storedFarms();
      expect(stored).toMatchObject({
        owner_user_id: 'farmer-uid',
        formVersionId: 'v1',
        primary_email: 'farmer@example.com',
        status: FarmStatus.PENDING_APPROVAL,
      });
    });

    test('stores the answers and copies them onto the farm fields the map and admin table read', async () => {
      await createFarmForFarmer(
        undefined,
        { email: 'farmer@example.com', input: validInput() },
        context
      );

      const [stored] = await storedFarms();
      expect(stored.answers).toEqual({
        growing_practices: ['Conventional'],
        food_safety_certifications: ['None of the above'],
        seasonal_products: ['Fruits and Vegetables'],
        seasonal_products_detail: 'peaches, strawberries',
        social_instagram: '@twobrooks',
        website: 'https://twobrooks.farm',
      });
      expect(stored).toMatchObject({
        growing_practices: ['Conventional'],
        seasonal_products: ['Fruits and Vegetables'],
        seasonal_products_detail: 'peaches, strawberries',
        website: 'https://twobrooks.farm',
        social_media: { instagram: '@twobrooks' },
      });
    });

    test('drops an answer to a question the admin could not see', async () => {
      const input = validInput({
        answers: {
          growing_practices: ['Conventional'],
          food_safety_certifications: ['None of the above'],
          // Only shown once a seasonal product is checked, and none is.
          seasonal_products_detail: 'should be dropped',
        },
      });

      await createFarmForFarmer(undefined, { email: 'farmer@example.com', input }, context);

      const [stored] = await storedFarms();
      expect(stored.answers).not.toHaveProperty('seasonal_products_detail');
      expect(stored.seasonal_products_detail).toBeNull();
    });

    test('emails the farmer the right kind of email for their account', async () => {
      mockGetOrCreateFarmerByEmail.mockResolvedValue(newFarmer('existing-uid', false));

      await createFarmForFarmer(
        undefined,
        { email: 'farmer@example.com', input: validInput() },
        context
      );

      expect(mockSendFarmAddedEmail).toHaveBeenCalledWith(
        'farmer@example.com',
        'Two Brooks Farm',
        false
      );
    });

    test('still creates the farm, and reports it, when the farmer email fails to send', async () => {
      mockSendFarmAddedEmail.mockRejectedValue(new Error('SMTP down'));

      const result = await createFarmForFarmer(
        undefined,
        { email: 'farmer@example.com', input: validInput() },
        context
      );

      expect(result.emailSent).toBe(false);
      expect(await storedFarms()).toHaveLength(1);
    });

    test('stays off the public map until an admin approves it', async () => {
      const result = await createFarmForFarmer(
        undefined,
        { email: 'farmer@example.com', input: validInput() },
        context
      );
      const farmService = new FarmService();

      await expect(farmService.getFarmsByProximity(32.3, -90.18, 50)).resolves.toEqual([]);

      await farmService.approveFarm(result.farm.id);
      const approved = await farmService.getFarmsByProximity(32.3, -90.18, 50);
      expect(approved.map((farm) => farm.id)).toEqual([result.farm.id]);
    });
  });

  describe('an invalid farm creates no account and no farm', () => {
    const expectNothingCreated = async () => {
      expect(mockGetOrCreateFarmerByEmail).not.toHaveBeenCalled();
      expect(mockSendFarmAddedEmail).not.toHaveBeenCalled();
      expect(await storedFarms()).toHaveLength(0);
    };

    test('when a required question is unanswered', async () => {
      const input = validInput({ answers: { food_safety_certifications: ['None of the above'] } });

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input }, context)
      ).rejects.toThrow('Please answer: Growing Practices');
      await expectNothingCreated();
    });

    test('when an answer picks a choice the form does not have', async () => {
      const input = validInput({
        answers: {
          growing_practices: ['Not a real practice'],
          food_safety_certifications: ['None of the above'],
        },
      });

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input }, context)
      ).rejects.toThrow("choices that don't exist");
      await expectNothingCreated();
    });

    test('when "None of the above" is combined with another choice', async () => {
      const input = validInput({
        answers: {
          growing_practices: ['Conventional', 'None of the above'],
          food_safety_certifications: ['None of the above'],
        },
      });

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input }, context)
      ).rejects.toThrow("can't combine that choice with others");
      await expectNothingCreated();
    });

    test('when an answer is for a question the form does not have', async () => {
      const input = validInput({
        answers: { ...validInput().answers, made_up_question: 'hi' },
      });

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input }, context)
      ).rejects.toThrow('Unknown questions in answers: made_up_question');
      await expectNothingCreated();
    });

    test('when the website is not a URL', async () => {
      const input = validInput({
        answers: { ...validInput().answers, website: 'not a website' },
      });

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input }, context)
      ).rejects.toThrow('must be a valid URL');
      await expectNothingCreated();
    });

    test('when a newer form version was published after the form was opened', async () => {
      await publishVersionWithRequiredQuestion();

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input: validInput() }, context)
      ).rejects.toThrow('The farm form has been updated since you opened it.');
      await expectNothingCreated();
    });

    test('when the USDA farm ID is already taken', async () => {
      await new FarmService().createFarm('someone-else', validInput());
      mockSendEmail.mockClear();

      await expect(
        createFarmForFarmer(
          undefined,
          { email: 'new@example.com', input: validInput({ farm_name: 'Copy Farm' }) },
          context
        )
      ).rejects.toThrow('Farm with that USDA farm ID already exists.');
      expect(mockGetOrCreateFarmerByEmail).not.toHaveBeenCalled();
      expect(await storedFarms()).toHaveLength(1);
    });

    test('when the caller is not an admin', async () => {
      mockRequireRole.mockRejectedValue(
        new ForbiddenError('You do not have permission to access this resource.')
      );

      await expect(
        createFarmForFarmer(undefined, { email: 'new@example.com', input: validInput() }, context)
      ).rejects.toThrow(ForbiddenError);
      await expectNothingCreated();
    });
  });

  describe('after an admin publishes a new form version', () => {
    test('a farm on the new version must answer its new required question', async () => {
      const v2 = await publishVersionWithRequiredQuestion();

      await expect(
        createFarmForFarmer(
          undefined,
          { email: 'new@example.com', input: validInput({ formVersionId: v2.id }) },
          context
        )
      ).rejects.toThrow('Please answer: Acres farmed');
      expect(mockGetOrCreateFarmerByEmail).not.toHaveBeenCalled();
    });

    test('a farm on the new version that answers it is created on that version', async () => {
      const v2 = await publishVersionWithRequiredQuestion();
      const input = validInput({
        formVersionId: v2.id,
        answers: { ...validInput().answers, q_acreage: '40' },
      });

      await createFarmForFarmer(undefined, { email: 'farmer@example.com', input }, context);

      const [stored] = await storedFarms();
      expect(stored.formVersionId).toBe(v2.id);
      expect(stored.answers).toMatchObject({ q_acreage: '40' });
    });
  });
});
