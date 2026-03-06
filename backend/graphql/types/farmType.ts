import { gql } from 'apollo-server';

const farmType = gql`
  type Query {
    farmById(id: ID!): FarmDTO!
    farmsByUserId(userId: ID!): [FarmDTO!]!
    farms: [FarmDTO!]!
  }

  type Mutation {
    createFarm(input: CreateFarmInput!): FarmDTO!
    updateFarm(id: ID!, input: UpdateFarmInput!): FarmDTO!
    deleteFarmById(id: ID!): Boolean!
  }

  enum FarmStatus {
    PENDING_APPROVAL
    APPROVED
    REJECTED
  }

  type GeoJSONPoint {
    type: String!
    coordinates: [Float!]!
  }

  type MarketSalesData {
    market: String!
    times: String!
  }

  type FarmDTO {
    id: ID!
    owner_user_id: ID!
    usda_farm_id: Int!
    farm_name: String!
    description: String!
    primary_phone: String!
    primary_email: String!
    website: String
    social_media: String
    farm_address: String!
    counties_served: [String!]!
    cities_served: [String!]!
    location: GeoJSONPoint!
    food_categories: [String!]!
    market_sales_data: [MarketSalesData!]
    bipoc_owned: Boolean!
    gap_certified: Boolean!
    food_safety_plan: Boolean!
    agritourism: Boolean!
    sells_at_markets: Boolean!
    csa_boxes: Boolean!
    online_sales: Boolean!
    delivery: Boolean!
    f2s_experience: Boolean!
    interested_in_f2s: Boolean!
    status: FarmStatus!
    createdAt: String!
    updatedAt: String!
  }

  input CreateFarmInput {
    usda_farm_id: Int!
    farm_name: String!
    description: String!
    primary_phone: String!
    primary_email: String!
    website: String
    social_media: String
    farm_address: String!
    counties_served: [String!]!
    cities_served: [String!]!
    location: GeoJSONPointInput!
    food_categories: [String!]!
    market_sales_data: [MarketSalesDataInput!]
    bipoc_owned: Boolean
    gap_certified: Boolean
    food_safety_plan: Boolean
    agritourism: Boolean
    sells_at_markets: Boolean
    csa_boxes: Boolean
    online_sales: Boolean
    delivery: Boolean
    f2s_experience: Boolean
    interested_in_f2s: Boolean
  }

  input UpdateFarmInput {
    farm_name: String
    description: String
    primary_phone: String
    primary_email: String
    website: String
    social_media: String
    farm_address: String
    counties_served: [String!]
    cities_served: [String!]
    location: GeoJSONPointInput
    food_categories: [String!]
    market_sales_data: [MarketSalesDataInput!]
    bipoc_owned: Boolean
    gap_certified: Boolean
    food_safety_plan: Boolean
    agritourism: Boolean
    sells_at_markets: Boolean
    csa_boxes: Boolean
    online_sales: Boolean
    delivery: Boolean
    f2s_experience: Boolean
    interested_in_f2s: Boolean
    status: FarmStatus
  }

  input GeoJSONPointInput {
    type: String!
    coordinates: [Float!]!
  }

  input MarketSalesDataInput {
    market: String!
    times: String!
  }
`;

export default farmType;
