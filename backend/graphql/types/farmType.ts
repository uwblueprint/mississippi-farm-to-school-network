import { gql } from 'apollo-server';

const farmType = gql`
  scalar JSON

  enum FarmStatus {
    PENDING_APPROVAL
    APPROVED
    REJECTED
  }

  type Location {
    lat: Float!
    lng: Float!
  }

  type MarketSalesData {
    market: String!
    times: String!
  }

  type FarmDTO {
    id: ID!
    owner_user_id: ID!
    owner: UserDTO
    usda_farm_id: String
    farm_name: String!
    primary_phone: String!
    primary_email: String!
    website: String
    social_media: JSON
    farm_address: String!
    county: String!
    cities_served: [String!]
    location: Location!
    seasonal_products: [String!]!
    meat_products: [String!]!
    other_products: [String!]!
    seasonal_products_detail: String
    meat_products_detail: String
    other_products_detail: String
    growing_practices: [String!]!
    food_safety_certifications: [String!]!
    farm_experiences: [String!]!
    farm_characteristics: [String!]!
    farm_to_school_sales: [String!]!
    market_sales_data: [MarketSalesData!]
    f2s_experience: String
    minimum_order: String
    delivery_details: String
    cover_photo: String
    carousel_photos: [String!]!
    status: FarmStatus!
    is_archived: Boolean!
    createdAt: String!
    updatedAt: String!
    """
    URL of the farm's first uploaded image, or null when it has none.
    Resolved from stored_files (see fileStorageResolvers) — FarmDTO itself holds
    no image. Lets list views show a photo without an N+1 of filesByFarm calls.
    """
    primary_image_url: String
  }

  input CreateFarmInput {
    usda_farm_id: String!
    farm_name: String!
    primary_phone: String!
    primary_email: String!
    website: String
    social_media: JSON
    farm_address: String!
    county: String!
    cities_served: [String!]
    location: LocationInput!
    seasonal_products: [String!]!
    meat_products: [String!]!
    other_products: [String!]!
    seasonal_products_detail: String
    meat_products_detail: String
    other_products_detail: String
    growing_practices: [String!]!
    food_safety_certifications: [String!]!
    farm_experiences: [String!]
    farm_characteristics: [String!]
    farm_to_school_sales: [String!]
    market_sales_data: [MarketSalesDataInput!]
    f2s_experience: String
    minimum_order: Int
    delivery_details: String
    cover_photo: String
    carousel_photos: [String!]
  }

  input LocationInput {
    lat: Float!
    lng: Float!
  }

  input MarketSalesDataInput {
    market: String!
    times: String!
  }

  input FarmFilter {
    status: FarmStatus
    counties: [String!]
    cities_served: [String!]
    seasonal_products: [String!]
    meat_products: [String!]
    other_products: [String!]
    approved: Boolean
    is_archived: Boolean
  }

  input UpdateFarmInput {
    usda_farm_id: String
    farm_name: String
    primary_phone: String
    primary_email: String
    website: String
    social_media: JSON
    farm_address: String
    county: String
    cities_served: [String!]
    location: LocationInput
    seasonal_products: [String!]
    meat_products: [String!]
    other_products: [String!]
    seasonal_products_detail: String
    meat_products_detail: String
    other_products_detail: String
    growing_practices: [String!]
    food_safety_certifications: [String!]
    farm_experiences: [String!]
    farm_characteristics: [String!]
    farm_to_school_sales: [String!]
    market_sales_data: [MarketSalesDataInput!]
    f2s_experience: String
    minimum_order: Int
    delivery_details: String
    cover_photo: String
    carousel_photos: [String!]
  }

  type Query {
    farms(filter: FarmFilter): [FarmDTO!]!
    myFarms: [FarmDTO!]!
    farmsByProximity(lat: Float!, lng: Float!, radiusKm: Float!): [FarmDTO!]!
    farmById(id: ID!): FarmDTO!
    farmsByStatus(status: FarmStatus!): [FarmDTO!]!
    latestActiveFarmRejection(farmId: ID!): ActiveFarmRejectionDTO
  }

  type Mutation {
    createFarm(input: CreateFarmInput!): FarmDTO!
    updateFarm(id: ID!, input: UpdateFarmInput!): FarmDTO!
    approveFarm(id: ID!): FarmDTO!
    resubmitFarm(id: ID!, input: UpdateFarmInput!): FarmDTO!
    archiveFarm(id: ID!): FarmDTO!
    unarchiveFarm(id: ID!): FarmDTO!
  }

  type ActiveFarmRejectionDTO {
    id: ID!
    farm_id: ID!
    rejection_reason: String!
    created_at: String!
  }
`;

export default farmType;
