import { makeExecutableSchema } from '@graphql-tools/schema';
import merge from 'lodash/merge';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import userResolvers from '@/graphql/resolvers/userResolvers';
import authResolvers from '@/graphql/resolvers/authResolvers';
import farmResolvers from '@/graphql/resolvers/farmResolvers';
import fileStorageResolvers from '@/graphql/resolvers/fileStorageResolvers';
import emailType from '@/graphql/types/emailType';
import userType from '@/graphql/types/userType';
import authType from '@/graphql/types/authType';
import farmType from '@/graphql/types/farmType';
import fileStorageType from '@/graphql/types/fileStorageType';

const executableSchema = makeExecutableSchema({
  typeDefs: [emailType, userType, authType, farmType, fileStorageType],
  resolvers: merge(emailResolvers, userResolvers, authResolvers, farmResolvers, fileStorageResolvers),
});

export default executableSchema;
