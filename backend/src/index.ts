import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server';
import * as admin from 'firebase-admin';

import executableSchema from '@/graphql';
import { initializeFirebaseAdmin } from '@/utilities/firebaseAdmin';

dotenv.config();

const PORT = process.env.PORT || 3000;

const firebaseReady = initializeFirebaseAdmin();

const server = new ApolloServer({
  schema: executableSchema,
  context: async ({ req }) => {
    const authHeader = req.headers.authorization || '';
    let firebaseUid: string | undefined;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        if (!firebaseReady || !admin.apps.length) {
          throw new Error('Firebase Admin is not initialized');
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
      } catch (error) {
        console.error('Error verifying Firebase token:', error, '\n');
      }
    }

    return { req, firebaseUid };
  },
});

server.listen({ port: Number(PORT) }).then(({ url }: { url: string }) => {
  console.log(`🚀 Server is running at ${url}`);
  if (firebaseReady) {
    console.log('Firebase Admin initialized (Auth + Firestore + Storage).');
  } else {
    console.warn(
      'Firebase Admin missing credentials — Auth/Firestore calls will fail until backend/.env is configured.'
    );
  }
});
