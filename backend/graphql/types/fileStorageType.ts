import { gql } from 'apollo-server';

const fileStorageType = gql`
  type Query {
    getFile(fileId: String!): String!
  }

  type Mutation {
    createFile(
      originalFileName: String!
      filePath: String!
      farmId: String!
      contentType: String
    ): String!
    updateFile(fileId: String!, filePath: String!, contentType: String): Boolean!
    deleteFile(fileId: String!): Boolean!
  }
`;

export default fileStorageType;
