export type SampleDTO = {
  id: number;
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
  ADMIN = 'ADMIN',
  FARMER = 'FARMER',
}

export type Token = {
  accessToken: string;
  refreshToken: string;
};

export type UserDTO = {
  id: string;
  firebase_uid: string;
  email: string;
  role: Role;
  is_verified: boolean;
};

export type CreateUserDTO = {
  email: string;
  role: Role;
  password?: string;
};

export type UpdateUserDTO = {
  email: string;
  role: Role;
};

export type RegisterUserDTO = {
  email: string;
  password: string;
};

export type AuthDTO = Token & UserDTO;

export enum SignUpMethod {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}
