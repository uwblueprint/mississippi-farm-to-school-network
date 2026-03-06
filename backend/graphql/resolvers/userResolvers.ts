import nodemailerConfig from '@/nodemailer.config';
import AuthService from '@/services/implementations/authService';
import EmailService from '@/services/implementations/emailService';
import UserService from '@/services/implementations/userService';
import IAuthService from '@/services/interfaces/authService';
import IEmailService from '@/services/interfaces/emailService';
import IUserService from '@/services/interfaces/userService';
import { CreateUserDTO, UpdateUserDTO, UserDTO } from '@/types';
import { AuthenticationError } from 'apollo-server-express';

import Farm from '@/models/farm.model';

const userService: IUserService = new UserService();
const emailService: IEmailService = new EmailService(nodemailerConfig);
const authService: IAuthService = new AuthService(userService, emailService);

const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: { firebaseUid?: string }): Promise<UserDTO> => {
      if (!context.firebaseUid) {
        throw new AuthenticationError('You must be logged in to view your profile.');
      }

      // Fetch the user from the database using the UID
      const user = await userService.getCurrentUser(context.firebaseUid);

      if (!user) {
        throw new AuthenticationError('User not found in database.');
      }

      return user;
    },
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
    verifyUserEmail: async (_parent: undefined, { email }: { email: string }): Promise<UserDTO> => {
      const user = await userService.verifyUserEmail(email);
      return user;
    },
  },
  UserDTO: {
    farms: async(user: UserDTO) => {
      return Farm.findAll({where: {owner_user_id: user.id}});
    }
  }
};

export default userResolvers;
