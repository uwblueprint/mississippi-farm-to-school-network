// Sample-related types for backend sample service, resolvers, and GraphQL

export type SampleDTO = {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO string for GraphQL compatibility
  updatedAt: string; // ISO string for GraphQL compatibility
};

export type CreateSampleDTO = {
  name: string;
  description: string;
};

export type NodemailerConfig = {
  service: 'gmail';
  auth: {
    type: 'OAuth2';
    user: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
};

export enum Role {
  User = 'User',
  Admin = 'Admin',
}

export type Token = {
  accessToken: string;
  refreshToken: string;
};

export type UserDTO = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

export type CreateUserDTO = Omit<UserDTO, 'id'> & {
  password?: string;
};

export type UpdateUserDTO = Omit<UserDTO, 'id'>;

export type RegisterUserDTO = Omit<CreateUserDTO, 'role'>;

export type AuthDTO = Token & UserDTO;

export enum SignUpMethod {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}
