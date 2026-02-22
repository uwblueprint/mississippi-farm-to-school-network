import * as firebaseAdmin from 'firebase-admin';
import IUserService from '@/services/interfaces/userService';
import { CreateUserDTO, Role, SignUpMethod, UpdateUserDTO, UserDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import User from '@/models/user.model';

const Logger = logger(__filename);

class UserService implements IUserService {
  async getUserById(userId: string): Promise<UserDTO> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`userId ${userId} not found.`);
      }

      return {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      };
    } catch (error: unknown) {
      Logger.error(`Failed to get user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserDTO> {
    try {
      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error(`user with email ${email} not found.`);
      }

      return {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      };
    } catch (error: unknown) {
      Logger.error(`Failed to get user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserRoleByAuthId(firebaseUid: string): Promise<Role> {
    try {
      const user = await User.findOne({
        where: { firebase_uid: firebaseUid },
      });
      if (!user) {
        throw new Error(`user with firebase_uid ${firebaseUid} not found.`);
      }
      return user.role;
    } catch (error: unknown) {
      Logger.error(`Failed to get user role. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserIdByAuthId(firebaseUid: string): Promise<string> {
    try {
      const user = await User.findOne({
        where: { firebase_uid: firebaseUid },
      });
      if (!user) {
        throw new Error(`user with firebase_uid ${firebaseUid} not found.`);
      }
      return user.id;
    } catch (error: unknown) {
      Logger.error(`Failed to get user id. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getAuthIdById(userId: string): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`userId ${userId} not found.`);
      }
      return user.firebase_uid;
    } catch (error: unknown) {
      Logger.error(`Failed to get firebase_uid. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUsers(): Promise<Array<UserDTO>> {
    try {
      const users = await User.findAll();
      return users.map((user) => ({
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      }));
    } catch (error: unknown) {
      Logger.error(`Failed to get users. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async createUser(
    user: CreateUserDTO,
    firebaseUid?: string,
    signUpMethod: SignUpMethod = SignUpMethod.PASSWORD
  ): Promise<UserDTO> {
    let newUser: User;
    let resolvedFirebaseUid: string;

    try {
      if (!firebaseUid) {
        // Create Firebase user
        if (signUpMethod === SignUpMethod.PASSWORD) {
          if (!user.password) {
            throw new Error('Password is required for password signup');
          }
          const firebaseUser = await firebaseAdmin.auth().createUser({
            email: user.email,
            password: user.password,
          });
          resolvedFirebaseUid = firebaseUser.uid;
        } else {
          throw new Error(`Unsupported signup method: ${signUpMethod}`);
        }
      } else {
        // Verify Firebase user exists
        await firebaseAdmin.auth().getUser(firebaseUid);
        resolvedFirebaseUid = firebaseUid;
      }

      try {
        newUser = await User.create({
          firebase_uid: resolvedFirebaseUid,
          email: user.email,
          role: user.role,
          is_verified: false,
        });
      } catch (postgresError) {
        // Rollback Firebase user creation if Postgres fails
        if (!firebaseUid) {
          try {
            await firebaseAdmin.auth().deleteUser(resolvedFirebaseUid);
          } catch (firebaseError: unknown) {
            const errorMessage = [
              'Failed to rollback Firebase user creation after Postgres user creation failure. Reason =',
              getErrorMessage(firebaseError),
              'Orphaned firebase_uid =',
              resolvedFirebaseUid,
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
      id: newUser.id,
      firebase_uid: newUser.firebase_uid,
      email: newUser.email,
      role: newUser.role,
      is_verified: newUser.is_verified,
    };
  }

  async updateUserById(userId: string, user: UpdateUserDTO): Promise<UserDTO> {
    try {
      const existingUser = await User.findByPk(userId);
      if (!existingUser) {
        throw new Error(`userId ${userId} not found.`);
      }

      // Update email in Firebase if it changed
      if (user.email !== existingUser.email) {
        try {
          await firebaseAdmin.auth().updateUser(existingUser.firebase_uid, { email: user.email });
        } catch (error) {
          Logger.error(`Failed to update Firebase user. Reason = ${getErrorMessage(error)}`);
          throw error;
        }
      }

      // Update in Postgres
      await existingUser.update({
        email: user.email,
        role: user.role,
      });

      return {
        id: existingUser.id,
        firebase_uid: existingUser.firebase_uid,
        email: existingUser.email,
        role: existingUser.role,
        is_verified: existingUser.is_verified,
      };
    } catch (error: unknown) {
      Logger.error(`Failed to update user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteUserById(userId: string): Promise<void> {
    try {
      const deletedUser = await User.findByPk(userId);

      if (!deletedUser) {
        throw new Error(`userId ${userId} not found.`);
      }

      // Delete from Postgres first
      await User.destroy({
        where: { id: userId },
      });

      // Then delete from Firebase
      try {
        await firebaseAdmin.auth().deleteUser(deletedUser.firebase_uid);
      } catch (error) {
        // Rollback: recreate the user in Postgres
        try {
          await User.create({
            id: deletedUser.id,
            firebase_uid: deletedUser.firebase_uid,
            email: deletedUser.email,
            role: deletedUser.role,
            is_verified: deletedUser.is_verified,
          });
        } catch (postgresError: unknown) {
          const errorMessage = [
            'Failed to rollback Postgres user deletion after Firebase user deletion failure. Reason =',
            getErrorMessage(postgresError),
            'Firebase uid with non-existent Postgres record =',
            deletedUser.firebase_uid,
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
      const deletedUser = await User.findOne({
        where: { email },
      });

      if (!deletedUser) {
        throw new Error(`user with email ${email} not found.`);
      }

      // Delete from Postgres first
      await User.destroy({
        where: { email },
      });

      // Then delete from Firebase
      try {
        await firebaseAdmin.auth().deleteUser(deletedUser.firebase_uid);
      } catch (error) {
        // Rollback: recreate the user in Postgres
        try {
          await User.create({
            id: deletedUser.id,
            firebase_uid: deletedUser.firebase_uid,
            email: deletedUser.email,
            role: deletedUser.role,
            is_verified: deletedUser.is_verified,
          });
        } catch (postgresError: unknown) {
          const errorMessage = [
            'Failed to rollback Postgres user deletion after Firebase user deletion failure. Reason =',
            getErrorMessage(postgresError),
            'Firebase uid with non-existent Postgres record =',
            deletedUser.firebase_uid,
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
