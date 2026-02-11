import * as firebaseAdmin from 'firebase-admin';
import IUserService from '../interfaces/userService';
import { CreateUserDTO, Role, SignUpMethod, UpdateUserDTO, UserDTO } from '../../types';
import { getErrorMessage } from '../../utilities/errorUtils';
import logger from '../../utilities/logger';
import User from '../../models/user.model';

const Logger = logger(__filename);

class UserService implements IUserService {
  async getUserById(userId: string): Promise<UserDTO> {
    let user: User | null;
    let firebaseUser: firebaseAdmin.auth.UserRecord;

    try {
      user = await User.findByPk(Number(userId));
      if (!user) {
        throw new Error(`userId ${userId} not found.`);
      }
      firebaseUser = await firebaseAdmin.auth().getUser(user.authId);
    } catch (error: unknown) {
      Logger.error(`Failed to get user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    return {
      id: String(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: firebaseUser.email ?? '',
      role: user.role,
    };
  }

  async getUserByEmail(email: string): Promise<UserDTO> {
    let user: User | null;
    let firebaseUser: firebaseAdmin.auth.UserRecord;

    try {
      firebaseUser = await firebaseAdmin.auth().getUserByEmail(email);
      user = await User.findOne({
        where: { authId: firebaseUser.uid },
      });

      if (!user) {
        throw new Error(`user with authId ${firebaseUser.uid} not found.`);
      }
    } catch (error: unknown) {
      Logger.error(`Failed to get user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    return {
      id: String(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: firebaseUser.email ?? '',
      role: user.role,
    };
  }

  async getUserRoleByAuthId(authId: string): Promise<Role> {
    try {
      const user: User | null = await User.findOne({
        where: { authId },
      });
      if (!user) {
        throw new Error(`user with authId ${authId} not found.`);
      }
      return user.role;
    } catch (error: unknown) {
      Logger.error(`Failed to get user role. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserIdByAuthId(authId: string): Promise<string> {
    try {
      const user: User | null = await User.findOne({
        where: { authId },
      });
      if (!user) {
        throw new Error(`user with authId ${authId} not found.`);
      }
      return String(user.id);
    } catch (error: unknown) {
      Logger.error(`Failed to get user id. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getAuthIdById(userId: string): Promise<string> {
    try {
      const user: User | null = await User.findByPk(Number(userId));
      if (!user) {
        throw new Error(`userId ${userId} not found.`);
      }
      return user.authId;
    } catch (error: unknown) {
      Logger.error(`Failed to get authId. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUsers(): Promise<Array<UserDTO>> {
    let userDtos: Array<UserDTO> = [];
    try {
      const users: Array<User> = await User.findAll();

      userDtos = await Promise.all(
        users.map(async (user) => {
          let firebaseUser: firebaseAdmin.auth.UserRecord;

          try {
            firebaseUser = await firebaseAdmin.auth().getUser(user.authId);
          } catch (error) {
            Logger.error(`user with authId ${user.authId} could not be fetched from Firebase`);
            throw error;
          }

          return {
            id: String(user.id),
            firstName: user.firstName,
            lastName: user.lastName,
            email: firebaseUser.email ?? '',
            role: user.role,
          };
        })
      );
    } catch (error: unknown) {
      Logger.error(`Failed to get users. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    return userDtos;
  }

  async createUser(
    user: CreateUserDTO,
    authId?: string,
    signUpMethod: SignUpMethod = SignUpMethod.PASSWORD
  ): Promise<UserDTO> {
    let newUser: User;
    let firebaseUser: firebaseAdmin.auth.UserRecord;

    try {
      if (!authId) {
        // Create Firebase user
        if (signUpMethod === SignUpMethod.PASSWORD) {
          if (!user.password) {
            throw new Error('Password is required for password signup');
          }
          firebaseUser = await firebaseAdmin.auth().createUser({
            email: user.email,
            password: user.password,
            displayName: `${user.firstName} ${user.lastName}`,
          });
        } else {
          throw new Error(`Unsupported signup method: ${signUpMethod}`);
        }
      } else {
        firebaseUser = await firebaseAdmin.auth().getUser(authId);
      }

      try {
        newUser = await User.create({
          firstName: user.firstName,
          lastName: user.lastName,
          authId: firebaseUser.uid,
          email: firebaseUser.email ?? user.email,
          role: user.role,
        });
      } catch (postgresError) {
        // Rollback Firebase user creation if Postgres fails
        if (!authId) {
          try {
            await firebaseAdmin.auth().deleteUser(firebaseUser.uid);
          } catch (firebaseError: unknown) {
            const errorMessage = [
              'Failed to rollback Firebase user creation after Postgres user creation failure. Reason =',
              getErrorMessage(firebaseError),
              'Orphaned authId (Firebase uid) =',
              firebaseUser.uid,
            ];
            Logger.error(errorMessage.join(' '));
          }
        }

        throw postgresError;
      }
    } catch (error: unknown) {
      Logger.error(`Failed to create user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    return {
      id: String(newUser.id),
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: firebaseUser.email ?? '',
      role: newUser.role,
    };
  }

  async updateUserById(userId: string, user: UpdateUserDTO): Promise<UserDTO> {
    let updatedFirebaseUser: firebaseAdmin.auth.UserRecord;

    try {
      const updateResult = await User.update(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        {
          where: { id: Number(userId) },
          returning: true,
        }
      );

      if (updateResult[0] < 1) {
        throw new Error(`userId ${userId} not found.`);
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const oldUser: User = (updateResult[1][0] as any)._previousDataValues;

      try {
        updatedFirebaseUser = await firebaseAdmin
          .auth()
          .updateUser(oldUser.authId, { email: user.email });
      } catch (error) {
        // rollback Postgres user updates
        try {
          await User.update(
            {
              firstName: oldUser.firstName,
              lastName: oldUser.lastName,
              role: oldUser.role,
            },
            {
              where: { id: Number(userId) },
            }
          );
        } catch (postgresError: unknown) {
          const errorMessage = [
            'Failed to rollback Postgres user update after Firebase user update failure. Reason =',
            getErrorMessage(postgresError),
            'Postgres user id with possibly inconsistent data =',
            oldUser.id,
          ];
          Logger.error(errorMessage.join(' '));
        }

        throw error;
      }
    } catch (error: unknown) {
      Logger.error(`Failed to update user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }

    return {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: updatedFirebaseUser.email ?? '',
      role: user.role,
    };
  }

  async deleteUserById(userId: string): Promise<void> {
    try {
      const deletedUser: User | null = await User.findByPk(Number(userId));

      if (!deletedUser) {
        throw new Error(`userId ${userId} not found.`);
      }

      const numDestroyed: number = await User.destroy({
        where: { id: Number(userId) },
      });

      if (numDestroyed <= 0) {
        throw new Error(`userId ${userId} was not deleted in Postgres.`);
      }

      try {
        await firebaseAdmin.auth().deleteUser(deletedUser.authId);
      } catch (error) {
        // rollback user deletion in Postgres
        try {
          await User.create({
            firstName: deletedUser.firstName,
            lastName: deletedUser.lastName,
            authId: deletedUser.authId,
            email: deletedUser.email,
            role: deletedUser.role,
          });
        } catch (postgresError: unknown) {
          const errorMessage = [
            'Failed to rollback Postgres user deletion after Firebase user deletion failure. Reason =',
            getErrorMessage(postgresError),
            'Firebase uid with non-existent Postgres record =',
            deletedUser.authId,
          ];
          Logger.error(errorMessage.join(' '));
        }

        throw error;
      }
    } catch (error: unknown) {
      Logger.error(`Failed to delete user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteUserByEmail(email: string): Promise<void> {
    try {
      const firebaseUser: firebaseAdmin.auth.UserRecord = await firebaseAdmin
        .auth()
        .getUserByEmail(email);
      const deletedUser: User | null = await User.findOne({
        where: { authId: firebaseUser.uid },
      });

      if (!deletedUser) {
        throw new Error(`user with authId ${firebaseUser.uid} not found.`);
      }

      const numDestroyed: number = await User.destroy({
        where: { authId: firebaseUser.uid },
      });

      if (numDestroyed <= 0) {
        throw new Error(`user with authId ${firebaseUser.uid} was not deleted in Postgres.`);
      }

      try {
        await firebaseAdmin.auth().deleteUser(deletedUser.authId);
      } catch (error) {
        // rollback user deletion in Postgres
        try {
          await User.create({
            firstName: deletedUser.firstName,
            lastName: deletedUser.lastName,
            authId: deletedUser.authId,
            email: deletedUser.email,
            role: deletedUser.role,
          });
        } catch (postgresError: unknown) {
          const errorMessage = [
            'Failed to rollback Postgres user deletion after Firebase user deletion failure. Reason =',
            getErrorMessage(postgresError),
            'Firebase uid with non-existent Postgres record =',
            deletedUser.authId,
          ];
          Logger.error(errorMessage.join(' '));
        }

        throw error;
      }
    } catch (error: unknown) {
      Logger.error(`Failed to delete user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default UserService;
