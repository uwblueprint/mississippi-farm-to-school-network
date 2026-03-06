import { makeExecutableSchema } from '@graphql-tools/schema';
import merge from 'lodash/merge';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import userResolvers from '@/graphql/resolvers/userResolvers';
import authResolvers from '@/graphql/resolvers/authResolvers';
import fileStorageResolvers from '@/graphql/resolvers/fileStorageResolvers';
import emailType from '@/graphql/types/emailType';
import userType from '@/graphql/types/userType';
import authType from '@/graphql/types/authType';
import fileStorageType from '@/graphql/types/fileStorageType';

const executableSchema = makeExecutableSchema({
  typeDefs: [emailType, userType, authType, fileStorageType],
  resolvers: merge(emailResolvers, userResolvers, authResolvers, fileStorageResolvers),
});

export default executableSchema;
