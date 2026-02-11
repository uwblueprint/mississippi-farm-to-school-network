import { gql } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { merge } from 'lodash';

import sampleResolvers from './resolvers/sampleResolvers';
import sampleType from './types/sampleType';
import userResolvers from './resolvers/userResolvers';
import userType from './types/userType';
import authResolvers from './resolvers/authResolvers';
import authType from './types/authType';

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
  typeDefs: [query, mutation, sampleType, userType, authType],
  resolvers: merge(sampleResolvers, userResolvers, authResolvers),
});

export default executableSchema;
