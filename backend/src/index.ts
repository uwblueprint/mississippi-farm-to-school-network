import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server';
import * as admin from 'firebase-admin';

import { sequelize } from '@/models';
import executableSchema from '@/graphql';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_SVC_ACCOUNT_PRIVATE_KEY &&
  process.env.FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL
) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_SVC_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL,
    }),
  });
} else {
  console.warn('Firebase Admin SDK not initialized - credentials not found');
}

const server = new ApolloServer({
  schema: executableSchema,
  context: ({ req }) => ({ req }),
});

server.listen({ port: Number(PORT) }).then(async ({ url }: { url: string }) => {
  console.log(`🚀 Server is running at ${url}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
