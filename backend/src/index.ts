import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server';

import '@/models';
import executableSchema from '@/graphql';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = new ApolloServer({
  schema: executableSchema,
});

server.listen({ port: Number(PORT) }).then(({ url }: { url: string }) => {
  console.log(`🚀 Server is running at ${url}`);
});
