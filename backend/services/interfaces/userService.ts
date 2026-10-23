import {
  CompleteUserProfileInput,
  CreateUserDTO,
  FarmerAccountResult,
  Role,
  UpdateMyProfileInput,
  UpdateUserDTO,
  UserDTO,
  SignUpMethod,
} from '@/types';

interface IUserService {
  /**
   * Get user associated with id
   * @param userId user's id
   * @returns a UserDTO with user's information
   * @throws Error if user retrieval fails
   */
  getUserById(userId: string): Promise<UserDTO>;

  /**
   * Get user associated with email
   * @param email user's email
   * @returns a UserDTO with user's information
   * @throws Error if user retrieval fails
   */
  getUserByEmail(email: string): Promise<UserDTO>;

  /**
   * Get user associated with a Firebase Auth uid. `UserDTO.id` mirrors the Firebase uid
   * (see `authHelpers.ts`), which is a different id space from the Firestore `users`
   * document id `getUserById` looks up by — use this whenever the id in hand came from
   * an authenticated user or an `owner_user_id`/`owner`-style reference, not from a raw
   * Firestore document id.
   * @param firebaseUid user's Firebase Auth uid
   * @returns a UserDTO with user's information
   * @throws Error if user retrieval fails
   */
  getUserByFirebaseUid(firebaseUid: string): Promise<UserDTO>;

  /**
   * Get role of user associated with authId
   * @param authId user's authId
   * @returns role of the user
   * @throws Error if user role retrieval fails
   */
  getUserRoleByAuthId(authId: string): Promise<Role>;

  /**
   * Get id of user associated with authId
   * @param authId user's authId
   * @returns id of the user
   * @throws Error if user id retrieval fails
   */
  getUserIdByAuthId(authId: string): Promise<string>;

  /**
   * Get authId of user associated with id
   * @param userId user's id
   * @returns user's authId
   * @throws Error if user authId retrieval fails
   */
  getAuthIdById(userId: string): Promise<string>;

  /**
   * Get all user information (possibly paginated in the future)
   * @returns array of UserDTOs
   * @throws Error if user retrieval fails
   */
  getUsers(): Promise<Array<UserDTO>>;

  /**
   * Create a user
   * @param user the user to be created
   * @param authId the user's firebase auth id, optional
   * @param signUpMethod the method user used to signup
   * @returns a UserDTO with the created user's information
   * @throws Error if user creation fails
   */
  createUser(user: CreateUserDTO, authId?: string, signUpMethod?: SignUpMethod): Promise<UserDTO>;

  /**
   * Find the farmer account for an email, creating it if there is none. A new account gets
   * the FARMER role, a random password nobody knows (the farmer sets their own through a
   * password reset link) and a pre-verified email. An existing account is returned as is:
   * its password and details are never changed.
   * @param email the farmer's email
   * @returns the account, and whether the farmer still needs a link to set a password
   * (the account is new, or has never been signed in to)
   * @throws Error if the email is invalid or belongs to a non-farmer account
   */
  getOrCreateFarmerByEmail(email: string): Promise<FarmerAccountResult>;

  /**
   * Update a user. Only mutable profile fields belong here; role is immutable after account
   * creation. Note: the password cannot be updated using this method, use IAuthService.resetPassword
   * instead.
   * @param userId user's id
   * @param user the user to be updated
   * @returns a UserDTO with the updated user's information
   * @throws Error if user update fails
   */
  updateUserById(userId: string, user: UpdateUserDTO): Promise<UserDTO>;

  /**
   * Delete a user by id
   * @param userId user's userId
   * @throws Error if user deletion fails
   */
  deleteUserById(userId: string): Promise<void>;

  /**
   * Delete a user by email
   * @param email user's email
   * @throws Error if user deletion fails
   */
  deleteUserByEmail(email: string): Promise<void>;

  /**
   * Sync Postgres is_verified to true after frontend has completed Firebase email verification.
   * @param email user's email
   * @returns updated UserDTO
   * @throws Error if user not found or already verified
   */
  verifyUserEmail(email: string): Promise<UserDTO>;

  /*
   * Complete user's profile during onboarding, updates user record
   * @param CompleteUserProfileInput includes firebase_uid, email, firstname, lastname, phone
   * @returns updated UserDTO
   * @throws Error if user not found or improper/missing inputs
   */
  completeUserProfile(input: CompleteUserProfileInput): Promise<UserDTO>;

  /**
   * Update the signed-in user's own editable profile fields (name and phone). Email and
   * role are intentionally not accepted here. Creates the profile doc from `authUser` if
   * the account has none yet.
   * @param authUser the signed-in user, as resolved from Firebase Auth
   * @param input firstName (required), lastName and phone (blank clears them)
   * @returns updated UserDTO
   * @throws Error if inputs are improper
   */
  updateMyProfile(authUser: UserDTO, input: UpdateMyProfileInput): Promise<UserDTO>;
}

export default IUserService;
