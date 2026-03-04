import { gql } from 'apollo-server';

const fileStorageType = gql`
  type Query {
    getFile(fileUUID: String!): String!
  }

  type Mutation {
    createFile(fileName: String!, filePath: String!, contentType: String): Boolean!
    updateFile(fileName: String!, filePath: String!, contentType: String): Boolean!
    deleteFile(fileName: String!): Boolean!
  }
`;

export default fileStorageType;
