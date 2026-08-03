const admin = require('firebase-admin');
const { Client } = require('pg');

(async () => {
  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_SVC_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL,
        }),
      });
    }
  }

  const email = process.argv[2] || 'test.farmer@example.com';
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, { emailVerified: true });

  const client = new Client({
    host: process.env.DB_HOST || 'db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB_DEV || 'mfsn_db',
  });
  await client.connect();
  const result = await client.query(
    'UPDATE users SET is_verified = true WHERE email = $1 RETURNING id, email, role, is_verified, firebase_uid',
    [email]
  );
  console.log(JSON.stringify({ firebaseUid: user.uid, emailVerified: true, db: result.rows[0] }, null, 2));
  await client.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
