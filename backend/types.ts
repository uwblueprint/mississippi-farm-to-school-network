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

// Farm Types
export type FarmDTO = {
  id: string;
  farmName: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  countiesServed: string[];
  foodCategories: string[];
  certifications: string[];
  description?: string;
  website?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  ownerUserId: string;
  createdAt: string; // ISO string for GraphQL compatibility
  updatedAt: string; // ISO string for GraphQL compatibility
};

export type UpdateFarmInput = {
  farmName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  countiesServed?: string[];
  foodCategories?: string[];
  certifications?: string[];
  description?: string;
  website?: string;
};

// Farm Filter
export interface FarmFilter {
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  countiesServed?: string[];
  foodCategories?: string[];
  approved?: boolean; // maps to status === 'APPROVED'
}
