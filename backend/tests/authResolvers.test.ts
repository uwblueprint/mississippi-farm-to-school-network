const mockGetUserByEmail = jest.fn();
const mockSendEmailVerificationLink = jest.fn();

jest.mock('@/services/implementations/userService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getUserByEmail: mockGetUserByEmail,
  })),
}));

jest.mock('@/services/implementations/emailService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/services/implementations/authService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendEmailVerificationLink: mockSendEmailVerificationLink,
  })),
}));

import authResolvers from '@/graphql/resolvers/authResolvers';
import authHelper from '@/utilities/authHelpers';

const EXISTING_EMAIL = 'user@example.com';
const MISSING_EMAIL = 'missing@example.com';
const USER_NOT_FOUND_ERROR = `User with email ${MISSING_EMAIL} not found.`;

const sendEmailVerificationLink = authResolvers.Mutation.sendEmailVerificationLink;
const callResolver = (email: string) => sendEmailVerificationLink(undefined, { email });

describe('authResolvers.sendEmailVerificationLink', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockReset();
    mockSendEmailVerificationLink.mockReset();
  });

  test('returns true and sends email for initial and resend requests', async () => {
    mockGetUserByEmail.mockResolvedValue({ email: EXISTING_EMAIL, is_verified: false });

    await expect(callResolver(EXISTING_EMAIL)).resolves.toBe(true);
    await expect(callResolver(EXISTING_EMAIL)).resolves.toBe(true);

    expect(mockGetUserByEmail).toHaveBeenCalledTimes(2);
    expect(mockGetUserByEmail).toHaveBeenCalledWith(EXISTING_EMAIL);
    expect(mockSendEmailVerificationLink).toHaveBeenCalledTimes(2);
    expect(mockSendEmailVerificationLink).toHaveBeenCalledWith(EXISTING_EMAIL);
  });

  test('returns an error when the email does not exist', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error(USER_NOT_FOUND_ERROR));

    await expect(callResolver(MISSING_EMAIL)).rejects.toThrow(USER_NOT_FOUND_ERROR);

    expect(mockGetUserByEmail).toHaveBeenCalledWith(MISSING_EMAIL);
    expect(mockSendEmailVerificationLink).not.toHaveBeenCalled();
  });
});

describe('authResolvers.sendMyVerificationEmail', () => {
  const sendMine = authResolvers.Mutation.sendMyVerificationEmail;
  const context = { firebaseUid: 'uid' };
  const requireAuth = jest.spyOn(authHelper, 'requireAuth');
  const signedIn = (id: string, is_verified = false) =>
    requireAuth.mockResolvedValue({
      id,
      email: `${id}@example.com`,
      is_verified,
    } as Awaited<ReturnType<typeof authHelper.requireAuth>>);

  beforeEach(() => {
    requireAuth.mockReset();
    mockSendEmailVerificationLink.mockReset();
  });

  test('sends to the signed-in user, once per cooldown', async () => {
    signedIn('cooldown-user');

    await expect(sendMine(undefined, undefined, context)).resolves.toBe(true);
    await expect(sendMine(undefined, undefined, context)).resolves.toBe(true);

    expect(mockSendEmailVerificationLink).toHaveBeenCalledTimes(1);
    expect(mockSendEmailVerificationLink).toHaveBeenCalledWith('cooldown-user@example.com');
  });

  test('does not email users who are already verified', async () => {
    signedIn('verified-user', true);

    await expect(sendMine(undefined, undefined, context)).resolves.toBe(true);

    expect(mockSendEmailVerificationLink).not.toHaveBeenCalled();
  });

  test('allows a retry straight after a failed send', async () => {
    signedIn('retry-user');
    mockSendEmailVerificationLink.mockRejectedValueOnce(new Error('mail down'));

    await expect(sendMine(undefined, undefined, context)).rejects.toThrow('mail down');
    await expect(sendMine(undefined, undefined, context)).resolves.toBe(true);

    expect(mockSendEmailVerificationLink).toHaveBeenCalledTimes(2);
  });

  test('rejects anonymous requests without sending', async () => {
    requireAuth.mockRejectedValue(new Error('You must be logged in'));

    await expect(sendMine(undefined, undefined, {})).rejects.toThrow('logged in');

    expect(mockSendEmailVerificationLink).not.toHaveBeenCalled();
  });
});
