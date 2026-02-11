import nodemailerConfig from '../../nodemailer.config';
import AuthService from '../../services/implementations/authService';
import EmailService from '../../services/implementations/emailService';
import UserService from '../../services/implementations/userService';
import IAuthService from '../../services/interfaces/authService';
import IEmailService from '../../services/interfaces/emailService';
import IUserService from '../../services/interfaces/userService';
import { CreateUserDTO, UpdateUserDTO, UserDTO } from '../../types';

const userService: IUserService = new UserService();
const emailService: IEmailService = new EmailService(nodemailerConfig);
const authService: IAuthService = new AuthService(userService, emailService);

const userResolvers = {
  Query: {
    userById: async (_parent: undefined, { id }: { id: string }): Promise<UserDTO> => {
      return userService.getUserById(id);
    },
    userByEmail: async (_parent: undefined, { email }: { email: string }): Promise<UserDTO> => {
      return userService.getUserByEmail(email);
    },
    users: async (): Promise<UserDTO[]> => {
      return userService.getUsers();
    },
  },
  Mutation: {
    createUser: async (_parent: undefined, { user }: { user: CreateUserDTO }): Promise<UserDTO> => {
      const newUser = await userService.createUser(user);
      await authService.sendEmailVerificationLink(newUser.email);
      return newUser;
    },
    updateUser: async (
      _parent: undefined,
      { id, user }: { id: string; user: UpdateUserDTO }
    ): Promise<UserDTO> => {
      return userService.updateUserById(id, user);
    },
    deleteUserById: async (_parent: undefined, { id }: { id: string }): Promise<boolean> => {
      await userService.deleteUserById(id);
      return true;
    },
    deleteUserByEmail: async (
      _parent: undefined,
      { email }: { email: string }
    ): Promise<boolean> => {
      await userService.deleteUserByEmail(email);
      return true;
    },
  },
};

export default userResolvers;
