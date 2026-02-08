import { gql } from 'apollo-server-express';

const sampleType = gql`
  type SampleDTO {
    id: String!
    name: String!
    description: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateSampleDTO {
    name: String!
    description: String!
  }

  extend type Query {
    sampleById(id: String!): SampleDTO!
    samples: [SampleDTO!]!
  }

  extend type Mutation {
    createSample(sample: CreateSampleDTO!): SampleDTO!
    updateSample(id: String!, sample: CreateSampleDTO!): SampleDTO!
    deleteSampleById(id: String!): SampleDTO!
  }
`;

export default sampleType;
