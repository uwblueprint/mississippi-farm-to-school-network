import { Role } from '@/types';

const mockGetUserById = jest.fn();
const mockUpdateUserById = jest.fn();
const mockRequireOwnerOrAdmin = jest.fn();

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getUserById: mockGetUserById,
    updateUserById: mockUpdateUserById,
  })),
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/services/implementations/authService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/services/implementations/farmService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/utilities/authHelpers', () => ({
  __esModule: true,
  default: { requireOwnerOrAdmin: mockRequireOwnerOrAdmin },
}));

import userResolvers from '@/graphql/resolvers/userResolvers';

const updateUser = userResolvers.Mutation.updateUser;
const context = { firebaseUid: 'firebase-1' };
const promoteInput = { email: 'me@example.com', role: Role.ADMIN };

describe('userResolvers.updateUser', () => {
  beforeEach(() => {
    mockGetUserById.mockReset();
    mockUpdateUserById.mockReset();
    mockRequireOwnerOrAdmin.mockReset();
    mockUpdateUserById.mockImplementation(async (id, user) => ({ id, ...user }));
  });

  test('a non-admin updating themselves cannot change their role', async () => {
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'firebase-1', role: Role.FARMER });
    mockGetUserById.mockResolvedValue({ id: 'firebase-1', role: Role.FARMER });

    await updateUser(undefined, { id: 'firebase-1', user: promoteInput }, context);

    expect(mockUpdateUserById).toHaveBeenCalledWith('firebase-1', {
      ...promoteInput,
      role: Role.FARMER,
    });
  });

  test('an admin can change a role', async () => {
    mockRequireOwnerOrAdmin.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });

    await updateUser(undefined, { id: 'firebase-1', user: promoteInput }, context);

    expect(mockGetUserById).not.toHaveBeenCalled();
    expect(mockUpdateUserById).toHaveBeenCalledWith('firebase-1', promoteInput);
  });
});
