import { gql } from 'apollo-server';

const userType = gql`
  type Query {
    userById(id: ID!): UserDTO!
    userByEmail(email: String!): UserDTO!
    users: [UserDTO!]!
    me: UserDTO!
  }

  type Mutation {
    createUser(user: CreateUserDTO!): UserDTO!
    updateUser(id: ID!, user: UpdateUserDTO!): UserDTO!
    deleteUserById(id: ID!): Boolean!
    deleteUserByEmail(email: String!): Boolean!
    verifyUserEmail(email: String!): UserDTO!
    completeUserProfile(input: CompleteUserProfileInput!): UserDTO!
  }

  enum Role {
    ADMIN
    FARMER
  }

  type UserDTO {
    id: ID!
    farms: [FarmDTO!]!
    firebase_uid: String!
    email: String!
    role: Role!
    is_verified: Boolean!
    firstName: String
    lastName: String
    phone: String
  }

  input CompleteUserProfileInput {
    firebase_uid: String!
    email: String!
    firstName: String!
    lastName: String!
    phone: String!
  }

  input CreateUserDTO {
    email: String!
    role: Role!
    password: String
    firstName: String
    lastName: String
    phone: String
  }

  input UpdateUserDTO {
    email: String!
    role: Role!
    firstName: String
    lastName: String
    phone: String
  }
`;

export default userType;
