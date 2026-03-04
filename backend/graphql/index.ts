import { makeExecutableSchema } from '@graphql-tools/schema';
import merge from 'lodash/merge';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import userResolvers from '@/graphql/resolvers/userResolvers';
import authResolvers from '@/graphql/resolvers/authResolvers';
import emailType from '@/graphql/types/emailType';
import userType from '@/graphql/types/userType';
import authType from '@/graphql/types/authType';

const executableSchema = makeExecutableSchema({
  typeDefs: [emailType, userType, authType],
  resolvers: merge(emailResolvers, userResolvers, authResolvers),
});

export default executableSchema;
