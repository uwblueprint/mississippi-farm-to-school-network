import { gql } from 'apollo-server';

const fileStorageType = gql`
  type FarmImageDTO {
    fileId: String!
    originalFileName: String!
    contentType: String
    url: String!
  }

  type Query {
    getFile(fileId: String!): String!
    filesByFarm(farmId: String!): [FarmImageDTO!]!
  }

  type Mutation {
    createFile(
      originalFileName: String!
      filePath: String!
      farmId: String!
      contentType: String
    ): String!
    uploadFarmImage(
      farmId: String!
      originalFileName: String!
      contentType: String!
      dataBase64: String!
    ): FarmImageDTO!
    updateFile(fileId: String!, filePath: String!, contentType: String): Boolean!
    deleteFile(fileId: String!): Boolean!
  }
`;

export default fileStorageType;
