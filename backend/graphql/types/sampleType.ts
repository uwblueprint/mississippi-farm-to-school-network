import { gql } from 'apollo-server';

const sampleType = gql`
  type Query {
    sampleById(id: Int!): SampleDTO!
    samples: [SampleDTO!]!
  }

  type Mutation {
    createSample(sample: CreateSampleDTO!): SampleDTO!
    updateSample(id: Int!, sample: CreateSampleDTO!): SampleDTO!
    deleteSampleById(id: Int!): SampleDTO!
  }

  type SampleDTO {
    id: Int!
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
