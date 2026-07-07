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
    specific_products: String!
    primary_phone: String!
    primary_email: String!
    website: String
    social_media: JSON
    farm_address: String!
    county: String!
    cities_served: [String!]
    location: Location!
    product_categories: [String!]!
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
    createdAt: String!
    updatedAt: String!
  }

  input CreateFarmInput {
    usda_farm_id: String!
    farm_name: String!
    specific_products: String!
    primary_phone: String!
    primary_email: String!
    website: String
    social_media: JSON
    farm_address: String!
    county: String!
    cities_served: [String!]
    location: LocationInput!
    product_categories: [String!]!
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
    product_categories: [String!]
    approved: Boolean
  }

  input UpdateFarmInput {
    usda_farm_id: String
    farm_name: String
    specific_products: String
    primary_phone: String
    primary_email: String
    website: String
    social_media: JSON
    farm_address: String
    county: String
    cities_served: [String!]
    location: LocationInput
    product_categories: [String!]
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
    farmById(id: ID!): FarmDTO!
    farmsByStatus(status: FarmStatus!): [FarmDTO!]!
  }

  type Mutation {
    createFarm(input: CreateFarmInput!): FarmDTO!
    updateFarm(id: ID!, input: UpdateFarmInput!): FarmDTO!
    approveFarm(id: ID!): FarmDTO!
  }
`;

export default farmType;
