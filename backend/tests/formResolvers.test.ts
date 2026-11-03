import { ApolloServer, ForbiddenError } from 'apollo-server';
import { Role } from '@/types';
import { FakeFirestore } from './helpers/fakeFirestore';

let mockFirestoreInstance: FakeFirestore;
let mockRole: Role = Role.ADMIN;

jest.mock('@/utilities/firestore', () => ({
  ...jest.requireActual('@/utilities/firestore'),
  getFirestore: () => mockFirestoreInstance,
}));

jest.mock('@/utilities/authHelpers', () => {
  const user = () => ({ id: 'user-1', email: 'user@example.com', role: mockRole });
  return {
    __esModule: true,
    default: {
      requireAuth: async () => user(),
      requireEmailVerified: async () => user(),
      requireOwnerOrAdmin: async () => user(),
      requireRole: async (_context: unknown, roles: Role[]) => {
        if (!roles.includes(mockRole)) throw new ForbiddenError('forbidden');
        return user();
      },
    },
  };
});

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => ({ sendEmail: jest.fn().mockResolvedValue(undefined) })),
}));

import schema from '@/graphql';

const server = new ApolloServer({ schema, context: {} });
const run = async (query: string, variables?: Record<string, unknown>) =>
  server.executeOperation({ query, variables });

const SECTIONS_FIELDS = `
  sections {
    id
    title
    questions { id type label required placeholder helpText exclusiveOptionId lockedField
      options { id label }
      showIf { questionId optionIds }
    }
  }
`;

const PUBLISHED_FORM = `query { publishedForm { id version ${SECTIONS_FIELDS} } }`;

const SAVE_FORM = `
  mutation ($baseVersionId: ID!, $sections: [FormSectionInput!]!) {
    saveForm(baseVersionId: $baseVersionId, sections: $sections) { id version }
  }
`;

const CREATE_FARM = `
  mutation ($input: CreateFarmInput!) {
    createFarm(input: $input) { id formVersionId answers growing_practices formVersion { id version } }
  }
`;

const farmInput = (formVersionId: string, answers: Record<string, unknown>) => ({
  usda_farm_id: `usda-${Math.random()}`,
  farm_name: 'Test Farm',
  primary_phone: '6015550100',
  primary_email: 'farm@example.com',
  farm_address: '123 Farm Rd',
  county: 'Hinds',
  location: { lat: 32.3, lng: -90.18 },
  formVersionId,
  answers,
});

describe('form GraphQL schema', () => {
  beforeEach(() => {
    mockFirestoreInstance = new FakeFirestore();
    mockRole = Role.ADMIN;
  });

  test('an edited form round-trips through publishedForm → saveForm → createFarm', async () => {
    mockRole = Role.FARMER;
    const first = await run(PUBLISHED_FORM);
    expect(first.errors).toBeUndefined();
    const v1 = (first.data as { publishedForm: { id: string; sections: unknown[] } }).publishedForm;
    expect(v1).toMatchObject({ id: 'v1', version: 1 });

    const forbidden = await run(SAVE_FORM, { baseVersionId: 'v1', sections: v1.sections });
    expect(forbidden.errors?.[0].message).toBe('forbidden');

    mockRole = Role.ADMIN;
    const sections = JSON.parse(JSON.stringify(v1.sections)) as Array<{
      id: string;
      questions: unknown[];
    }>;
    sections
      .find((section) => section.id === 'other_details')!
      .questions.push({ id: 'q_acres', type: 'TEXT', label: 'Acres farmed', required: true });
    const saved = await run(SAVE_FORM, { baseVersionId: 'v1', sections });
    expect(saved.errors).toBeUndefined();
    expect(saved.data).toEqual({ saveForm: { id: 'v2', version: 2 } });

    mockRole = Role.FARMER;
    const answers = {
      growing_practices: ['Conventional'],
      food_safety_certifications: ['GAP Certified'],
    };

    const stale = await run(CREATE_FARM, { input: farmInput('v1', answers) });
    expect(stale.errors?.[0].message).toContain('form has been updated');

    const missing = await run(CREATE_FARM, { input: farmInput('v2', answers) });
    expect(missing.errors?.[0].message).toContain('Acres farmed');

    const created = await run(CREATE_FARM, {
      input: farmInput('v2', { ...answers, q_acres: '40' }),
    });
    expect(created.errors).toBeUndefined();
    expect(created.data).toMatchObject({
      createFarm: {
        formVersionId: 'v2',
        answers: { ...answers, q_acres: '40' },
        growing_practices: ['Conventional'],
        formVersion: { id: 'v2', version: 2 },
      },
    });
  });
});
