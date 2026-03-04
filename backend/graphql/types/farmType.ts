import { gql } from 'apollo-server';

const farmType = gql`
  type Query {
    farmsByProximity(lat: Float!, lng: Float!, radiusKm: Float!): [FarmDTO!]!
  }

  enum FarmStatus {
    PENDING_APPROVAL
    APPROVED
    REJECTED
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
    location: String!
    food_categories: [String!]!
    market_sales_data: String
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
`;

export default farmType;
