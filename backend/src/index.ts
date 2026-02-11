import dotenv from 'dotenv';
import express from 'express';
import * as admin from 'firebase-admin';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import schema from '../graphql';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const CORS_ALLOW_LIST = [
  'http://localhost:3000',
  'http://localhost:5173',
  /^http:\/\/localhost:\d+$/,
];

const CORS_OPTIONS: cors.CorsOptions = {
  origin: CORS_ALLOW_LIST,
  credentials: true,
};

// Middleware
app.use(cookieParser());
app.use(cors(CORS_OPTIONS));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Sequelize
const DATABASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL!
    : `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.POSTGRES_DB_DEV}`;

const sequelize = new Sequelize(DATABASE_URL, {
  models: [path.join(__dirname, '..', 'models', '*.model.ts')],
  logging: false,
});

// Initialize Firebase Admin
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Using service account file
  admin.initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_SVC_ACCOUNT_PRIVATE_KEY &&
  process.env.FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL
) {
  // Using environment variables
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

// Initialize Apollo Server
const server = new ApolloServer({
  schema,
  context: ({ req, res }) => ({ req, res }),
});

async function startServer() {
  await server.start();

  server.applyMiddleware({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app: app as any,
    path: '/graphql',
    cors: { origin: CORS_ALLOW_LIST, credentials: true },
  });

  // Test database connection
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  // Basic routes
  app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
