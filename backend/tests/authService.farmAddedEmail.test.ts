import AuthService from '@/services/implementations/authService';
import type IUserService from '@/services/interfaces/userService';
import type IEmailService from '@/services/interfaces/emailService';

const mockGeneratePasswordResetLink = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: () => ({ generatePasswordResetLink: mockGeneratePasswordResetLink }),
}));

jest.mock('@/utilities/firebaseRestClient', () => ({ __esModule: true, default: {} }));

const RESET_LINK = 'https://example.firebaseapp.com/reset?oobCode=abc';

describe('AuthService.sendFarmAddedEmail', () => {
  const mockSendEmail = jest.fn();
  const emailService = { sendEmail: mockSendEmail } as unknown as IEmailService;
  const userService = {} as IUserService;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  let service: AuthService;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://app.example.org';
    mockGeneratePasswordResetLink.mockReset().mockResolvedValue(RESET_LINK);
    mockSendEmail.mockReset().mockResolvedValue(undefined);
    service = new AuthService(userService, emailService);
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  test('a farmer who needs a password gets a set-password link', async () => {
    await service.sendFarmAddedEmail('farmer@example.com', 'Two Brooks Farm', true);

    expect(mockGeneratePasswordResetLink).toHaveBeenCalledWith('farmer@example.com');
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, template] = mockSendEmail.mock.calls[0];
    expect(to).toBe('farmer@example.com');
    expect(subject).toMatch(/set your password/i);
    expect(template).toMatchObject({
      ctaText: 'Set password',
      ctaUrl: RESET_LINK,
      isFarmerEmail: true,
    });
    expect(template.body).toContain('Two Brooks Farm');
    expect(template.body).toMatch(/forgot password/i);
    expect(template.body).toMatch(/already signed up/i);
  });

  test('a farmer who already has a password is only pointed to sign in', async () => {
    await service.sendFarmAddedEmail('farmer@example.com', 'Two Brooks Farm', false);

    expect(mockGeneratePasswordResetLink).not.toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [to, , template] = mockSendEmail.mock.calls[0];
    expect(to).toBe('farmer@example.com');
    expect(template).toMatchObject({
      ctaText: 'Sign in',
      ctaUrl: 'https://app.example.org/login',
    });
    expect(template.body).toContain('Two Brooks Farm');
    expect(template.body).toMatch(/password has not changed/i);
    expect(JSON.stringify(template)).not.toContain(RESET_LINK);
  });

  test('fails when no email service is configured', async () => {
    const withoutEmail = new AuthService(userService, null);

    await expect(
      withoutEmail.sendFarmAddedEmail('farmer@example.com', 'Two Brooks Farm', true)
    ).rejects.toThrow('does not have an EmailService');
  });

  test('passes on a failure to send', async () => {
    mockSendEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      service.sendFarmAddedEmail('farmer@example.com', 'Two Brooks Farm', false)
    ).rejects.toThrow('SMTP down');
  });
});
