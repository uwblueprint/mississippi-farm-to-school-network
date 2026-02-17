import { gql } from 'apollo-server';

const sampleType = gql`
  type Query {
    sampleById(id: String!): SampleDTO!
    samples: [SampleDTO!]!
  }

  type Mutation {
    createSample(sample: CreateSampleDTO!): SampleDTO!
    updateSample(id: String!, sample: CreateSampleDTO!): SampleDTO!
    deleteSampleById(id: String!): SampleDTO!
  }

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
`;

export default sampleType;
