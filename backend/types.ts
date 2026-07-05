import type {
  GrowingPractice,
  ProductCategory,
  FoodSafetyCertification,
  FarmExperience,
  FarmCharacteristic,
  FarmToSchoolSale,
} from '@/constants/farmOptions';

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

export type CompleteUserProfileInput = {
  firebase_uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
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
  usda_farm_id: string | null;
  farm_name: string;
  specific_products: string;
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: Record<string, unknown> | null;
  farm_address: string;
  counties_served: string[];
  cities_served: string[];
  location: LocationDTO;
  food_categories: ProductCategory[];
  growing_practices: GrowingPractice[];
  food_safety_certifications: FoodSafetyCertification[];
  farm_experiences: FarmExperience[];
  farm_characteristics: FarmCharacteristic[];
  farm_to_school_sales: FarmToSchoolSale[];
  market_sales_data: { market: string; times: string }[] | null;
  f2s_experience: string | null;
  minimum_order: string | null;
  delivery_details: string | null;
  cover_photo: string | null;
  carousel_photos: string[];
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
  specific_products: string;
  primary_phone: string;
  primary_email: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address: string;
  usda_farm_id: string;
  counties_served: string[];
  cities_served?: string[];
  location: LocationDTO;
  food_categories: ProductCategory[];
  growing_practices: GrowingPractice[];
  food_safety_certifications: FoodSafetyCertification[];
  farm_experiences?: FarmExperience[];
  farm_characteristics?: FarmCharacteristic[];
  farm_to_school_sales?: FarmToSchoolSale[];
  market_sales_data?: { market: string; times: string }[];
  f2s_experience?: string;
  minimum_order?: string;
  delivery_details?: string;
  cover_photo?: string;
  carousel_photos?: string[];
};

export type AuthDTO = Token & UserDTO;

export enum SignUpMethod {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}

export type UpdateFarmInput = {
  usda_farm_id?: string;
  farm_name?: string;
  specific_products?: string;
  primary_phone?: string;
  primary_email?: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address?: string;
  counties_served?: string[];
  cities_served?: string[];
  location?: LocationDTO;
  food_categories?: ProductCategory[];
  growing_practices?: GrowingPractice[];
  food_safety_certifications?: FoodSafetyCertification[];
  farm_experiences?: FarmExperience[];
  farm_characteristics?: FarmCharacteristic[];
  farm_to_school_sales?: FarmToSchoolSale[];
  market_sales_data?: { market: string; times: string }[];
  f2s_experience?: string;
  minimum_order?: string;
  delivery_details?: string;
  cover_photo?: string;
  carousel_photos?: string[];
};

export interface FarmFilter {
  status?: FarmStatus;
  counties_served?: string[];
  cities_served?: string[];
  food_categories?: string[];
  approved?: boolean;
}

export type AnnouncementDTO = {
  id: string;
  message: string;
  start_date: string;
  end_date?: string;
  created_by: string;
  deleted_at?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAnnouncementDTO = {
  message: string;
  start_date: string;
  end_date?: string;
};

export type UpdateAnnouncementDTO = {
  message?: string;
  start_date?: string;
  end_date?: string;
};

export type CreateAnnouncementResult = {
  announcement: AnnouncementDTO;
  overlappingAnnouncements: AnnouncementDTO[];
};

export type StoredFileDTO = {
  id: string;
  storage_key: string;
  original_file_name: string;
  owner_user_id: string;
  farm_id: string;
  content_type: string | null;
};
