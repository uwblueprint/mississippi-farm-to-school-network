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
  }

  enum Role {
    User
    Admin
  }

  type UserDTO {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: Role!
  }

  input CreateUserDTO {
    firstName: String!
    lastName: String!
    email: String!
    role: Role!
    password: String
  }

  input UpdateUserDTO {
    firstName: String!
    lastName: String!
    email: String!
    role: Role!
  }
`;

export default userType;
