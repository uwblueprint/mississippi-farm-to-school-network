import { gql } from 'apollo-server';

const imageType = gql`
  type Query {
    getImages(farmId: String!): [Image!]!
  }

  type Mutation {
    requestImageUploadUrl(farmId: String!, contentType: String!): ImageUploadTarget!
    uploadImageToFarm(input: UploadImageInput!): Image!
    modifyImage(imageId: String!, input: ModifyImageInput!): Image!
    deleteImage(imageId: String!): Boolean!
  }

  type Image {
    id: ID!
    farmId: ID!
    contentType: String!
    size: Float!
    dimensions: ImageDimensions!
    index: Int!
    url: String!
  }

  type ImageDimensions {
    width: Int!
    height: Int!
  }

  type ImageUploadTarget {
    uploadUrl: String!
    imageId: ID!
    storageKey: String!
  }

  input ImageDimensionsInput {
    width: Int!
    height: Int!
  }

  input UploadImageInput {
    imageId: String!
    farmId: String!
    contentType: String!
    size: Float!
    dimensions: ImageDimensionsInput!
    index: Int
  }

  input ModifyImageInput {
    index: Int
    contentType: String
  }
`;

export default imageType;
