import { AuthenticationError } from 'apollo-server';
import * as firebaseAdmin from 'firebase-admin';
import IUserService from '@/services/interfaces/userService';
import {
  CompleteUserProfileInput,
  CreateUserDTO,
  Role,
  SignUpMethod,
  UpdateUserDTO,
  UserDTO,
} from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import logger from '@/utilities/logger';
import { Collections, getFirestore, newId, toIso } from '@/utilities/firestore';

const Logger = logger(__filename);

type UserDoc = {
  firebase_uid: string;
  email: string;
  role: Role;
  is_verified: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

function toUserDTO(id: string, data: UserDoc): UserDTO {
  return {
    id,
    firebase_uid: data.firebase_uid,
    email: data.email,
    role: data.role,
    is_verified: data.is_verified,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  };
}

class UserService implements IUserService {
  private users() {
    return getFirestore().collection(Collections.users);
  }

  private async findByFirebaseUid(firebaseUid: string): Promise<{ id: string; data: UserDoc } | null> {
    const snap = await this.users().where('firebase_uid', '==', firebaseUid).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, data: doc.data() as UserDoc };
  }

  private async findByEmail(email: string): Promise<{ id: string; data: UserDoc } | null> {
    const snap = await this.users().where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, data: doc.data() as UserDoc };
  }

  async getUserById(userId: string): Promise<UserDTO> {
    try {
      const doc = await this.users().doc(userId).get();
      if (!doc.exists) {
        throw new Error(`User with id ${userId} not found.`);
      }
      return toUserDTO(doc.id, doc.data() as UserDoc);
    } catch (error: unknown) {
      Logger.error(`Failed to get user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserDTO> {
    try {
      const found = await this.findByEmail(email);
      if (!found) {
        throw new Error(`User with email ${email} not found.`);
      }
      return toUserDTO(found.id, found.data);
    } catch (error: unknown) {
      Logger.error(`Failed to get user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async verifyUserEmail(email: string): Promise<UserDTO> {
    try {
      const found = await this.findByEmail(email);
      if (!found) {
        throw new Error(`User with email ${email} not found.`);
      }
      if (found.data.is_verified) {
        throw new Error(`User with email ${email} is already verified.`);
      }

      const firebaseUser = await firebaseAdmin.auth().getUser(found.data.firebase_uid);
      if (!firebaseUser.emailVerified) {
        throw new AuthenticationError('You must verify your email to access this resource.');
      }

      const updatedAt = new Date().toISOString();
      await this.users().doc(found.id).update({ is_verified: true, updatedAt });
      return toUserDTO(found.id, { ...found.data, is_verified: true, updatedAt });
    } catch (error: unknown) {
      Logger.error(`Failed to verify user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserRoleByAuthId(firebaseUid: string): Promise<Role> {
    try {
      const found = await this.findByFirebaseUid(firebaseUid);
      if (!found) {
        throw new Error(`User with firebase_uid ${firebaseUid} not found.`);
      }
      return found.data.role;
    } catch (error: unknown) {
      Logger.error(`Failed to get user role. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUserIdByAuthId(firebaseUid: string): Promise<string> {
    try {
      const found = await this.findByFirebaseUid(firebaseUid);
      if (!found) {
        throw new Error(`User with firebase_uid ${firebaseUid} not found.`);
      }
      return found.id;
    } catch (error: unknown) {
      Logger.error(`Failed to get user id. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getAuthIdById(userId: string): Promise<string> {
    try {
      const doc = await this.users().doc(userId).get();
      if (!doc.exists) {
        throw new Error(`User with id ${userId} not found.`);
      }
      return (doc.data() as UserDoc).firebase_uid;
    } catch (error: unknown) {
      Logger.error(`Failed to get firebase_uid. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getCurrentUser(firebaseUid: string): Promise<UserDTO> {
    try {
      const found = await this.findByFirebaseUid(firebaseUid);
      if (!found) {
        throw new Error(`User with firebase_uid ${firebaseUid} not found.`);
      }
      return toUserDTO(found.id, found.data);
    } catch (error: unknown) {
      Logger.error(`Failed to get user role. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUsers(): Promise<Array<UserDTO>> {
    try {
      const snap = await this.users().get();
      return snap.docs.map((doc) => toUserDTO(doc.id, doc.data() as UserDoc));
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
    let resolvedFirebaseUid: string;

    try {
      if (!firebaseUid) {
        if (signUpMethod === SignUpMethod.PASSWORD) {
          if (!user.password) {
            throw new Error('Password is required for password signup.');
          }
          const firebaseUser = await firebaseAdmin.auth().createUser({
            email: user.email,
            password: user.password,
          });
          resolvedFirebaseUid = firebaseUser.uid;
        } else {
          throw new Error(`Unsupported signup method: ${signUpMethod}.`);
        }
      } else {
        await firebaseAdmin.auth().getUser(firebaseUid);
        resolvedFirebaseUid = firebaseUid;
      }

      const id = newId();
      const now = new Date().toISOString();
      const data: UserDoc = {
        firebase_uid: resolvedFirebaseUid,
        email: user.email,
        role: user.role,
        is_verified: false,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        phone: user.phone ?? null,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await this.users().doc(id).set(data);
      } catch (firestoreError) {
        if (!firebaseUid) {
          try {
            await firebaseAdmin.auth().deleteUser(resolvedFirebaseUid);
          } catch (firebaseError: unknown) {
            Logger.error(
              `Failed to rollback Firebase user after Firestore create failure. Reason = ${getErrorMessage(firebaseError)} Orphaned firebase_uid = ${resolvedFirebaseUid}`
            );
          }
        }
        throw firestoreError;
      }

      return toUserDTO(id, data);
    } catch (error: unknown) {
      Logger.error(`Failed to create user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateUserById(userId: string, user: UpdateUserDTO): Promise<UserDTO> {
    try {
      const doc = await this.users().doc(userId).get();
      if (!doc.exists) {
        throw new Error(`User with id ${userId} not found.`);
      }
      const existing = doc.data() as UserDoc;

      if (user.email !== existing.email) {
        try {
          await firebaseAdmin.auth().updateUser(existing.firebase_uid, { email: user.email });
        } catch (error) {
          Logger.error(`Failed to update Firebase user. Reason = ${getErrorMessage(error)}`);
          throw error;
        }
      }

      const updated: UserDoc = {
        ...existing,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? existing.firstName,
        lastName: user.lastName ?? existing.lastName,
        phone: user.phone ?? existing.phone,
        updatedAt: new Date().toISOString(),
      };
      await this.users().doc(userId).set(updated);
      return toUserDTO(userId, updated);
    } catch (error: unknown) {
      Logger.error(`Failed to update user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async completeUserProfile(input: CompleteUserProfileInput): Promise<UserDTO> {
    try {
      if (
        !input.firebase_uid ||
        !input.email ||
        !input.firstName ||
        !input.lastName ||
        !input.phone
      ) {
        throw new Error(
          'All fields are required: firebase_uid, email, firstName, lastName, phone.'
        );
      }

      if (!input.firstName.trim() || !input.lastName.trim()) {
        throw new Error('First name and last name must not be empty.');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new Error('Invalid email format.');
      }

      const digits = input.phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        throw new Error('Phone number must contain exactly 10 digits.');
      }

      const found = await this.findByFirebaseUid(input.firebase_uid);
      if (!found) {
        throw new Error(`User with firebase_uid ${input.firebase_uid} not found.`);
      }

      const role = input.email.endsWith('@mississippifarmtoschool.org') ? Role.ADMIN : Role.FARMER;
      const updated: UserDoc = {
        ...found.data,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: digits,
        role,
        updatedAt: new Date().toISOString(),
      };
      await this.users().doc(found.id).set(updated);
      return toUserDTO(found.id, updated);
    } catch (error: unknown) {
      Logger.error(`Failed to complete user profile. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteUserById(userId: string): Promise<void> {
    try {
      const doc = await this.users().doc(userId).get();
      if (!doc.exists) {
        throw new Error(`User with id ${userId} not found.`);
      }
      const deletedUser = doc.data() as UserDoc;

      await this.users().doc(userId).delete();

      try {
        await firebaseAdmin.auth().deleteUser(deletedUser.firebase_uid);
      } catch (error) {
        try {
          await this.users().doc(userId).set({
            ...deletedUser,
            createdAt: toIso(deletedUser.createdAt),
            updatedAt: new Date().toISOString(),
          });
        } catch (firestoreError: unknown) {
          Logger.error(
            `Failed to rollback Firestore user deletion after Firebase delete failure. Reason = ${getErrorMessage(firestoreError)} firebase_uid = ${deletedUser.firebase_uid}`
          );
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
      const found = await this.findByEmail(email);
      if (!found) {
        throw new Error(`User with email ${email} not found.`);
      }
      await this.deleteUserById(found.id);
    } catch (error: unknown) {
      Logger.error(`Failed to delete user. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default UserService;
