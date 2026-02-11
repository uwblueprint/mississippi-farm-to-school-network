import { gql } from 'apollo-server-express';

const authType = gql`
  type AuthDTO {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: Role!
    accessToken: String!
    refreshToken: String!
  }

  input RegisterUserDTO {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
  }

  extend type Query {
    isAuthorizedByRole(accessToken: String!, roles: [Role!]!): Boolean!
    isAuthorizedByUserId(accessToken: String!, userId: ID!): Boolean!
    isAuthorizedByEmail(accessToken: String!, email: String!): Boolean!
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthDTO!
    loginWithGoogle(idToken: String!): AuthDTO!
    register(user: RegisterUserDTO!): AuthDTO!
    refresh(refreshToken: String!): String!
    logout(userId: ID!): Boolean!
    resetPassword(email: String!): Boolean!
  }
`;

export default authType;
