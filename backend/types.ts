import type {
  GrowingPractice,
  SeasonalProduct,
  MeatProduct,
  OtherProduct,
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

export type EmailActionButton = {
  label: string;
  href: string;
};

export type EmailChangeEntry = {
  field: string;
  previous: string;
  current: string;
};

export type EmailTemplateData = {
  title?: string;
  body?: string;
  actionButton?: EmailActionButton;
  previewText?: string;
  footerText?: string;
  brandName?: string;
  recipientName?: string;
  reasonText?: string;
  ctaText?: string;
  ctaUrl?: string;
  isFarmerEmail?: boolean;
  /** Rendered as a real list in EmailLayout, not embedded as HTML in `body`. */
  changes?: EmailChangeEntry[];
};

export type EmailServiceOptions = {
  brandName?: string;
  brandUrl?: string;
  supportEmail?: string;
};

export enum FarmStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export enum Role {
  ADMIN = 'ADMIN',
  FARMER = 'FARMER',
}

/** Emails on this domain are treated as ADMIN when no stored role says otherwise. */
export const ADMIN_EMAIL_DOMAIN = '@mississippifarmtoschool.org';

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
  /** Mark the email as already verified (Firebase Auth and the user doc). Defaults to false. */
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type FarmerAccountResult = {
  user: UserDTO;
  /**
   * True when the farmer has no password they know yet: the account was just created, or
   * nobody has ever signed in to it. They need a set-password link instead of a sign-in link.
   */
  needsPasswordSetup: boolean;
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

export type UpdateMyProfileInput = {
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
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
  primary_phone: string;
  primary_email: string;
  website: string | null;
  social_media: Record<string, unknown> | null;
  farm_address: string;
  county: string;
  cities_served: string[];
  location: LocationDTO;
  seasonal_products: SeasonalProduct[];
  meat_products: MeatProduct[];
  other_products: OtherProduct[];
  seasonal_products_detail: string | null;
  meat_products_detail: string | null;
  other_products_detail: string | null;
  growing_practices: GrowingPractice[];
  food_safety_certifications: FoodSafetyCertification[];
  farm_experiences: FarmExperience[];
  farm_characteristics: FarmCharacteristic[];
  farm_to_school_sales: FarmToSchoolSale[];
  market_sales_data: { market: string; times: string }[] | null;
  f2s_experience: string | null;
  minimum_order: number | null;
  delivery_details: string | null;
  cover_photo: string | null;
  carousel_photos: string[];
  status: FarmStatus;
  is_archived: boolean;
  // True once the farm has ever been rejected, even after a later resubmission
  // or approval. Used to distinguish a first-time application from a resubmitted
  // one — createdAt/updatedAt differ on any edit, not just a post-rejection one.
  was_previously_rejected: boolean;
  // Set when the farm is soft-deleted (status DELETED); cleared on restore.
  deleted_at: string | null;
  deletion_reason: string | null;
  // Set while the owner's deletion request awaits admin review. The farm keeps
  // its status (and its map listing) until an admin approves the deletion.
  deletion_requested_at: string | null;
  // Set when an admin approves the deletion; the farm is soft-deleted (status DELETED) at the same time.
  deletion_approved_at: string | null;
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
  primary_phone: string;
  primary_email: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address: string;
  usda_farm_id: string;
  county: string;
  cities_served?: string[];
  location: LocationDTO;
  seasonal_products: SeasonalProduct[];
  meat_products: MeatProduct[];
  other_products: OtherProduct[];
  seasonal_products_detail?: string;
  meat_products_detail?: string;
  other_products_detail?: string;
  growing_practices: GrowingPractice[];
  food_safety_certifications: FoodSafetyCertification[];
  farm_experiences?: FarmExperience[];
  farm_characteristics?: FarmCharacteristic[];
  farm_to_school_sales?: FarmToSchoolSale[];
  market_sales_data?: { market: string; times: string }[];
  f2s_experience?: string;
  minimum_order?: number;
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
  primary_phone?: string;
  primary_email?: string;
  website?: string;
  social_media?: Record<string, unknown>;
  farm_address?: string;
  county?: string;
  cities_served?: string[];
  location?: LocationDTO;
  seasonal_products?: SeasonalProduct[];
  meat_products?: MeatProduct[];
  other_products?: OtherProduct[];
  seasonal_products_detail?: string;
  meat_products_detail?: string;
  other_products_detail?: string;
  growing_practices?: GrowingPractice[];
  food_safety_certifications?: FoodSafetyCertification[];
  farm_experiences?: FarmExperience[];
  farm_characteristics?: FarmCharacteristic[];
  farm_to_school_sales?: FarmToSchoolSale[];
  market_sales_data?: { market: string; times: string }[];
  f2s_experience?: string;
  minimum_order?: number;
  delivery_details?: string;
  cover_photo?: string;
  carousel_photos?: string[];
};

export interface FarmFilter {
  status?: FarmStatus;
  counties?: string[];
  cities_served?: string[];
  seasonal_products?: string[];
  meat_products?: string[];
  other_products?: string[];
  approved?: boolean;
  is_archived?: boolean;
}

export type ActiveFarmRejectionDTO = Pick<
  FarmRejectionDTO,
  'id' | 'farm_id' | 'rejection_reason' | 'created_at'
>;

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

export type PublicAnnouncementDTO = Pick<
  AnnouncementDTO,
  'id' | 'message' | 'start_date' | 'end_date'
>;

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

export type ImageDimensionsDTO = {
  width: number;
  height: number;
};

export type ImageDTO = {
  id: string;
  farm_id: string;
  storage_key: string;
  content_type: string;
  size: number;
  dimensions: ImageDimensionsDTO;
  index: number;
};
