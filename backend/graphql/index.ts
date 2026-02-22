import { makeExecutableSchema } from '@graphql-tools/schema';
import merge from 'lodash/merge';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import sampleResolvers from '@/graphql/resolvers/sampleResolvers';
import userResolvers from '@/graphql/resolvers/userResolvers';
import authResolvers from '@/graphql/resolvers/authResolvers';
import emailType from '@/graphql/types/emailType';
import sampleType from '@/graphql/types/sampleType';
import userType from '@/graphql/types/userType';
import authType from '@/graphql/types/authType';

const executableSchema = makeExecutableSchema({
  typeDefs: [sampleType, emailType, userType, authType],
  resolvers: merge(sampleResolvers, emailResolvers, userResolvers, authResolvers),
});

export default executableSchema;
