import { makeExecutableSchema } from '@graphql-tools/schema';
import { JSONResolver } from 'graphql-scalars';
import merge from 'lodash/merge';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import userResolvers from '@/graphql/resolvers/userResolvers';
import authResolvers from '@/graphql/resolvers/authResolvers';
import farmResolvers from '@/graphql/resolvers/farmResolvers';
import fileStorageResolvers from '@/graphql/resolvers/fileStorageResolvers';
import announcementResolvers from '@/graphql/resolvers/announcementResolvers';
import imageResolvers from '@/graphql/resolvers/imageResolvers';
import emailType from '@/graphql/types/emailType';
import userType from '@/graphql/types/userType';
import authType from '@/graphql/types/authType';
import farmType from '@/graphql/types/farmType';
import fileStorageType from '@/graphql/types/fileStorageType';
import announcementType from '@/graphql/types/announcementType';
import imageType from '@/graphql/types/imageType';

const executableSchema = makeExecutableSchema({
  typeDefs: [emailType, userType, authType, farmType, fileStorageType, announcementType, imageType],
  resolvers: merge(
    { JSON: JSONResolver },
    emailResolvers,
    userResolvers,
    authResolvers,
    farmResolvers,
    fileStorageResolvers,
    announcementResolvers,
    imageResolvers
  ),
});

export default executableSchema;
