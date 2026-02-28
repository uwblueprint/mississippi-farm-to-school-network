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

export enum FarmStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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

export type FarmDTO = {
  id: string;
  owner_user_id: string;
  usda_farm_id: number;
  farm_name: string;
  description: string;
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: Record<string, unknown> | null;
  farm_address: string;
  counties_served: string[];
  cities_served: string[];
  location: { type: 'Point'; coordinates: [number, number] }; // GeoJSON format
  food_categories: string[];
  market_sales_data: { market: string; times: string }[] | null;
  bipoc_owned: boolean;
  gap_certified: boolean;
  food_safety_plan: boolean;
  agritourism: boolean;
  sells_at_markets: boolean;
  csa_boxes: boolean;
  online_sales: boolean;
  delivery: boolean;
  f2s_experience: boolean;
  interested_in_f2s: boolean;
  status: FarmStatus;
  createdAt: string; // ISO string for GraphQL compatibility
  updatedAt: string; // ISO string for GraphQL compatibility
};

export type CreateFarmInput = {
  farm_name: string;
  description: string;
  primary_phone: string;
  primary_email: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address: string;
  counties_served: string[];
  cities_served: string[];
  location: { type: 'Point'; coordinates: [number, number] };
  food_categories: string[];
  market_sales_data?: { market: string; times: string }[];
  bipoc_owned?: boolean;
  gap_certified?: boolean;
  food_safety_plan?: boolean;
  agritourism?: boolean;
  sells_at_markets?: boolean;
  csa_boxes?: boolean;
  online_sales?: boolean;
  delivery?: boolean;
  f2s_experience?: boolean;
  interested_in_f2s?: boolean;
};

export type AuthDTO = Token & UserDTO;

export enum SignUpMethod {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}
