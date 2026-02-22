import nodemailerConfig from '@/nodemailer.config';
import AuthService from '@/services/implementations/authService';
import EmailService from '@/services/implementations/emailService';
import UserService from '@/services/implementations/userService';
import IAuthService from '@/services/interfaces/authService';
import IEmailService from '@/services/interfaces/emailService';
import IUserService from '@/services/interfaces/userService';
import { AuthDTO, RegisterUserDTO, Role, SignUpMethod } from '@/types';

const userService: IUserService = new UserService();
const emailService: IEmailService = new EmailService(nodemailerConfig);
const authService: IAuthService = new AuthService(userService, emailService);

const authResolvers = {
  Query: {
    isAuthorizedByRole: async (
      _parent: undefined,
      { accessToken, roles }: { accessToken: string; roles: Role[] }
    ): Promise<boolean> => {
      const isAuthorized = await authService.isAuthorizedByRole(accessToken, new Set(roles));
      return isAuthorized;
    },
    isAuthorizedByUserId: async (
      _parent: undefined,
      { accessToken, userId }: { accessToken: string; userId: string }
    ): Promise<boolean> => {
      const isAuthorized = await authService.isAuthorizedByUserId(accessToken, userId);
      return isAuthorized;
    },
    isAuthorizedByEmail: async (
      _parent: undefined,
      { accessToken, email }: { accessToken: string; email: string }
    ): Promise<boolean> => {
      const isAuthorized = await authService.isAuthorizedByEmail(accessToken, email);
      return isAuthorized;
    },
  },
  Mutation: {
    login: async (
      _parent: undefined,
      { email, password }: { email: string; password: string }
    ): Promise<AuthDTO> => {
      const authDTO = await authService.generateToken(email, password);
      return authDTO;
    },
    loginWithGoogle: async (
      _parent: undefined,
      { idToken }: { idToken: string }
    ): Promise<AuthDTO> => {
      const authDTO = await authService.generateTokenOAuth(idToken);
      return authDTO;
    },
    register: async (_parent: undefined, { user }: { user: RegisterUserDTO }): Promise<AuthDTO> => {
      if (!user.password) {
        throw new Error('Password is required for registration');
      }
      const newUser = await userService.createUser(
        {
          ...user,
          role: Role.FARMER, // Default role for registration
        },
        undefined,
        SignUpMethod.PASSWORD
      );
      await authService.sendEmailVerificationLink(newUser.email);
      const authDTO = await authService.generateToken(user.email, user.password);
      return authDTO;
    },
    refresh: async (
      _parent: undefined,
      { refreshToken }: { refreshToken: string }
    ): Promise<string> => {
      const token = await authService.renewToken(refreshToken);
      return token.accessToken;
    },
    logout: async (_parent: undefined, { userId }: { userId: string }): Promise<boolean> => {
      await authService.revokeTokens(userId);
      return true;
    },
    resetPassword: async (_parent: undefined, { email }: { email: string }): Promise<boolean> => {
      await authService.resetPassword(email);
      return true;
    },
  },
};

export default authResolvers;
