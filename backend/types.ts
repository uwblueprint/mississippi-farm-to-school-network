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
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export type CreateUserDTO = {
  email: string;
  role: Role;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type UpdateUserDTO = {
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type RegisterUserDTO = {
  email: string;
  password: string;
};

export type LocationDTO = {
  lat: number;
  lng: number;
};

export type GeoJSONPointDTO = {
  type: 'Point';
  coordinates: [number, number];
};

export type FarmDTO = {
  id: string;
  owner_user_id: string;
  usda_farm_id: number | null;
  farm_name: string;
  description: string;
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: Record<string, unknown> | null;
  farm_address: string;
  counties_served: string[];
  cities_served: string[];
  location: LocationDTO;
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
  createdAt: string;
  updatedAt: string;
};

export type FarmSnapshotDTO = Omit<FarmDTO, 'location'> & {
  location: GeoJSONPointDTO;
};

export enum FarmRejectionResolutionType {
  RESUBMITTED = 'RESUBMITTED',
  APPROVED = 'APPROVED',
  WITHDRAWN = 'WITHDRAWN',
}

export type FarmRejectionDTO = {
  id: string;
  farm_id: string;
  rejected_by_user_id: string;
  rejection_reason: string;
  farm_snapshot: FarmSnapshotDTO;
  farm_snapshot_updated_at: string;
  created_at: string;
  resolved_at: string | null;
  resolution_type: FarmRejectionResolutionType | null;
};

export type CreateFarmInput = {
  farm_name: string;
  description: string;
  primary_phone: string;
  primary_email: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address: string;
  usda_farm_id: number;
  counties_served: string[];
  cities_served: string[];
  location: LocationDTO;
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

export type UpdateFarmInput = {
  usda_farm_id?: number;
  farm_name?: string;
  description?: string;
  primary_phone?: string;
  primary_email?: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address?: string;
  counties_served?: string[];
  cities_served?: string[];
  location?: LocationDTO;
  food_categories?: string[];
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

export interface FarmFilter {
  status?: FarmStatus;
  counties_served?: string[];
  cities_served?: string[];
  food_categories?: string[];
  approved?: boolean;
}
