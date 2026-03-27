import User from '@/models/user.model';
import UserService from '@/services/implementations/userService';
import { Role } from '@/types';

const mockUpdateFirebaseUser = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    updateUser: mockUpdateFirebaseUser,
  })),
}));

jest.mock('@/models/user.model');

const MockUser = User as jest.Mocked<typeof User>;

const makeUserInstance = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-1',
  firebase_uid: 'firebase-1',
  email: 'old@example.com',
  role: Role.ADMIN,
  is_verified: true,
  firstName: null,
  lastName: null,
  phone: null,
  update: jest.fn().mockImplementation(async function (
    this: Record<string, unknown>,
    values: Record<string, unknown>
  ) {
    Object.assign(this, values);
    return this;
  }),
  ...overrides,
});

describe('UserService.updateUserById', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    mockUpdateFirebaseUser.mockReset();
    MockUser.findByPk.mockReset();
  });

  test('updates email and role', async () => {
    const existingUser = makeUserInstance();
    MockUser.findByPk.mockResolvedValue(existingUser as any);

    const result = await service.updateUserById('user-1', {
      email: 'new@example.com',
      role: Role.FARMER,
    });

    expect(mockUpdateFirebaseUser).toHaveBeenCalledWith('firebase-1', {
      email: 'new@example.com',
    });
    expect(existingUser.update).toHaveBeenCalledWith({
      email: 'new@example.com',
      role: Role.FARMER,
      firstName: null,
      lastName: null,
      phone: null,
    });
    expect(result.email).toBe('new@example.com');
    expect(result.role).toBe(Role.FARMER);
  });

  test('does not call Firebase when the email address is unchanged', async () => {
    const existingUser = makeUserInstance();
    MockUser.findByPk.mockResolvedValue(existingUser as any);

    const result = await service.updateUserById('user-1', {
      email: 'old@example.com',
      role: Role.FARMER,
    });

    expect(mockUpdateFirebaseUser).not.toHaveBeenCalled();
    expect(existingUser.update).toHaveBeenCalledWith({
      email: 'old@example.com',
      role: Role.FARMER,
      firstName: null,
      lastName: null,
      phone: null,
    });
    expect(result.role).toBe(Role.FARMER);
  });
});
