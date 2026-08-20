import dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '@/utilities/firebaseAdmin';
import { Collections, getFirestore } from '@/utilities/firestore';
import { Role } from '@/types';

async function main() {
  const [email, roleArg, password] = process.argv.slice(2);
  const role = roleArg?.toUpperCase() as Role | undefined;
  if (!email || (role !== Role.ADMIN && role !== Role.FARMER)) {
    console.error('Usage: npx tsx scripts/provisionUser.ts <email> <ADMIN|FARMER> [password]');
    process.exit(1);
  }

  if (!initializeFirebaseAdmin()) {
    throw new Error('Firebase Admin not initialized — check backend/.env credentials');
  }

  const auth = admin.auth();

  let user: admin.auth.UserRecord;
  try {
    user = await auth.getUserByEmail(email);
    const updates: admin.auth.UpdateRequest = { emailVerified: true };
    if (password) {
      updates.password = password;
    }
    user = await auth.updateUser(user.uid, updates);
    console.log(
      `Updated existing auth user ${user.uid}: email verified${password ? ', password set' : ''}`
    );
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') {
      throw error;
    }
    if (!password) {
      console.error(`No account exists for ${email}; pass a password to create one.`);
      process.exit(1);
    }
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Created auth user ${user.uid} with verified email`);
  }

  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role });
  console.log(`Set custom claim role=${role} on ${user.uid}`);

  const users = getFirestore().collection(Collections.users);
  const doc = await users.doc(user.uid).get();
  const now = new Date().toISOString();
  if (doc.exists) {
    await users.doc(user.uid).update({ role, is_verified: true, updatedAt: now });
    console.log(`Updated Firestore users/${user.uid} to role=${role}`);
  } else {
    await users.doc(user.uid).set({
      firebase_uid: user.uid,
      email,
      role,
      is_verified: true,
      firstName: null,
      lastName: null,
      phone: null,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created Firestore users/${user.uid} with role=${role}`);
  }

  console.log(
    `Done. ${email} is a verified ${role}. An already-signed-in session must sign out and back in to pick up the new claim.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
