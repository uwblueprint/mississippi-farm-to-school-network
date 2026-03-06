import { gql } from 'apollo-server';

export const farmTypeDefs = gql`
  enum FarmStatus {
    PENDING_APPROVAL
    APPROVED
    REJECTED
  }

  type Farm {
    id: ID!
    farmName: String!
    ownerFirstName: String!
    ownerLastName: String!
    email: String!
    phoneNumber: String!
    address: String!
    city: String!
    state: String!
    zipCode: String!
    countiesServed: [String!]!
    foodCategories: [String!]!
    certifications: [String!]!
    description: String
    website: String
    status: FarmStatus!
    ownerUserId: String!
    createdAt: String!
    updatedAt: String!
  }

  input FarmFilter {
    status: FarmStatus
    countiesServed: [String!]
    foodCategories: [String!]
    approved: Boolean
  }

  input UpdateFarmInput {
    farmName: String
    ownerFirstName: String
    ownerLastName: String
    email: String
    phoneNumber: String
    address: String
    city: String
    state: String
    zipCode: String
    countiesServed: [String!]
    foodCategories: [String!]
    certifications: [String!]
    description: String
    website: String
  }

  type Query {
    farms(filter: FarmFilter): [Farm!]!
  }

  type Mutation {
    updateFarm(id: ID!, input: UpdateFarmInput!): Farm!
  }
`;
