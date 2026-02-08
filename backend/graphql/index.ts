import { gql } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { merge } from 'lodash';

import sampleResolvers from './resolvers/sampleResolvers';
import sampleType from './types/sampleType';

const query = gql`
  type Query {
    _empty: String
  }
`;

const mutation = gql`
  type Mutation {
    _empty: String
  }
`;

const executableSchema = makeExecutableSchema({
  typeDefs: [query, mutation, sampleType],
  resolvers: merge(sampleResolvers),
});

export default executableSchema;
