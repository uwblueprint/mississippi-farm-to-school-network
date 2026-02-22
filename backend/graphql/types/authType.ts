import { gql } from 'apollo-server';

const authType = gql`
  type Query {
    isAuthorizedByRole(accessToken: String!, roles: [Role!]!): Boolean!
    isAuthorizedByUserId(accessToken: String!, userId: ID!): Boolean!
    isAuthorizedByEmail(accessToken: String!, email: String!): Boolean!
  }

  type Mutation {
    login(email: String!, password: String!): AuthDTO!
    loginWithGoogle(idToken: String!): AuthDTO!
    register(user: RegisterUserDTO!): AuthDTO!
    refresh(refreshToken: String!): String!
    logout(userId: ID!): Boolean!
    resetPassword(email: String!): Boolean!
  }

  type AuthDTO {
    id: ID!
    firebase_uid: String!
    email: String!
    role: Role!
    is_verified: Boolean!
    accessToken: String!
    refreshToken: String!
  }

  input RegisterUserDTO {
    email: String!
    password: String!
  }
`;

export default authType;
