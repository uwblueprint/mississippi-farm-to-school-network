import { gql } from 'apollo-server';

const userType = gql`
  type Query {
    userById(id: ID!): UserDTO!
    userByEmail(email: String!): UserDTO!
    users: [UserDTO!]!
  }

  type Mutation {
    createUser(user: CreateUserDTO!): UserDTO!
    updateUser(id: ID!, user: UpdateUserDTO!): UserDTO!
    deleteUserById(id: ID!): Boolean!
    deleteUserByEmail(email: String!): Boolean!
    verifyUserEmail(email: String!, token: String!): UserDTO!
  }

  enum Role {
    ADMIN
    FARMER
  }

  type UserDTO {
    id: ID!
    firebase_uid: String!
    email: String!
    role: Role!
    is_verified: Boolean!
  }

  input CreateUserDTO {
    email: String!
    role: Role!
    password: String
  }

  input UpdateUserDTO {
    email: String!
    role: Role!
  }
`;

export default userType;
