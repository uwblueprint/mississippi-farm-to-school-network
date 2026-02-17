import { makeExecutableSchema } from '@graphql-tools/schema';

import emailResolvers from '@/graphql/resolvers/emailResolvers';
import sampleResolvers from '@/graphql/resolvers/sampleResolvers';
import emailType from '@/graphql/types/emailType';
import sampleType from '@/graphql/types/sampleType';

const executableSchema = makeExecutableSchema({
  typeDefs: [sampleType, emailType],
  resolvers: {
    Query: { ...sampleResolvers.Query },
    Mutation: {
      ...sampleResolvers.Mutation,
      ...emailResolvers.Mutation,
    },
  },
});

export default executableSchema;
