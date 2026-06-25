const mockGetUserByEmail = jest.fn();
const mockSendEmailVerificationLink = jest.fn();

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getUserByEmail: mockGetUserByEmail,
  })),
}));

jest.mock('@/services/implementations/authService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendEmailVerificationLink: mockSendEmailVerificationLink,
  })),
}));

import authResolvers from '@/graphql/resolvers/authResolvers';

const sendEmailVerificationLink = (email: string) =>
  authResolvers.Mutation.sendEmailVerificationLink(undefined, { email });

describe('Mutation.sendEmailVerificationLink', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockReset();
    mockSendEmailVerificationLink.mockReset();
  });

  test('sends the verification email and returns true for an existing user', async () => {
    mockGetUserByEmail.mockResolvedValue({ email: 'user@example.com' });

    await expect(sendEmailVerificationLink('user@example.com')).resolves.toBe(true);
    expect(mockSendEmailVerificationLink).toHaveBeenCalledWith('user@example.com');
  });

  test('resends the verification email on subsequent calls', async () => {
    mockGetUserByEmail.mockResolvedValue({ email: 'user@example.com' });

    await sendEmailVerificationLink('user@example.com');
    await sendEmailVerificationLink('user@example.com');

    expect(mockSendEmailVerificationLink).toHaveBeenCalledTimes(2);
  });

  test('throws and does not send when the user does not exist', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error('User with email user@example.com not found.'));

    await expect(sendEmailVerificationLink('user@example.com')).rejects.toThrow('not found');
    expect(mockSendEmailVerificationLink).not.toHaveBeenCalled();
  });
});
