import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as admin from 'firebase-admin';
import { parse } from 'csv-parse/sync';

dotenv.config();

const COLLECTION = process.env.FIRESTORE_SEED_COLLECTION || 'farms';
const CSV_FILE_PATH = path.resolve(__dirname, '../seed-data/sample.csv');
const BATCH_SIZE = 500;

interface RawCsvRow {
  [key: string]: string | undefined;
}

interface FarmDocument {
  id: string;
  data: {
    interestedInSellingToSchoolsOrECECenters: boolean;
    willingToHostFieldTripsOrOnFarmEducation: boolean;
    county: string | null;
    otherCountyOrCitysServed: string | null;
    address: string | null;
    farmName: string;
    contactPerson: string | null;
    phoneNumber: string | null;
    emailAddress: string | null;
    website: string | null;
    socialMedia: string | null;
    productsGrownSold: string | null;
    growingPractices: string | null;
    csaAvailable: boolean;
    farmersMarketSales: string | null;
    onlineSalesOrderingAvailable: string | null;
    minimumOrderRequirements: string | null;
    experienceWithFarmToSchoolSales: string | null;
    gapGhpCertified: boolean;
    bipocOwned: boolean;
    offersAgritourismOpportunities: boolean;
    notes: string | null;
  };
}

function initializeFirestore(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
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
      throw new Error(
        'Missing Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID/FIREBASE_SVC_ACCOUNT_PRIVATE_KEY/FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL.',
      );
    }
  }

  return admin.firestore();
}

function parseBoolean(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === 'y';
}

function parseString(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function getDeterministicDocId(uniqueValue: string): string {
  return crypto.createHash('sha256').update(uniqueValue.trim().toLowerCase()).digest('hex');
}

function mapCsvRowToFarmDocument(row: RawCsvRow): FarmDocument {
  const farmName = parseString(row['Farm Name']);
  if (!farmName) {
    throw new Error('Missing required unique field "Farm Name" for row. Each row must include a farm name.');
  }

  return {
    id: getDeterministicDocId(farmName),
    data: {
      interestedInSellingToSchoolsOrECECenters: parseBoolean(row['Interested in Selling to Schools or ECE Centers?']),
      willingToHostFieldTripsOrOnFarmEducation: parseBoolean(row['Willing to Host Field Trips or On-Farm Education?']),
      county: parseString(row['County']),
      otherCountyOrCitysServed: parseString(row['Other County or Citys Served']),
      address: parseString(row['Address']),
      farmName,
      contactPerson: parseString(row['Contact Person']),
      phoneNumber: parseString(row['Phone Number']),
      emailAddress: parseString(row['Email Address']),
      website: parseString(row['Website (if applicable)']),
      socialMedia: parseString(row['Social Media (if applicable)']),
      productsGrownSold: parseString(row['Products Grown/Sold (Contact for Availability)']),
      growingPractices: parseString(row['Growing Practices (e.g., organic, certified naturally grown, conventional, regenerative, hydroponic)']),
      csaAvailable: parseBoolean(row['CSA Available?']),
      farmersMarketSales: parseString(row['Farmer\'s Market Sales (Which markets/days)']),
      onlineSalesOrderingAvailable: parseString(row['Online Sales/Ordering Available']),
      minimumOrderRequirements: parseString(row['Minimum Order Requirements (for schools/ECEs)']),
      experienceWithFarmToSchoolSales: parseString(row['Experience with Farm to School/ECE Sales?']),
      gapGhpCertified: parseBoolean(row['GAP/GHP Certified']),
      bipocOwned: parseBoolean(row['Does your farm identify as a BIPOC-Owened?']),
      offersAgritourismOpportunities: parseBoolean(row['Offers Agritourism Opportunities?']),
      notes: parseString(row['Notes/Other']),
    },
  };
}

function readCsvFile(): RawCsvRow[] {
  const fileBuffer = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  const records = parse<RawCsvRow>(fileBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records;
}

async function commitBatches(
  db: admin.firestore.Firestore,
  writes: Array<(batch: admin.firestore.WriteBatch) => void>,
): Promise<void> {
  let batch = db.batch();
  let count = 0;

  for (const write of writes) {
    write(batch);
    count += 1;
    if (count === BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
}

export async function seed(): Promise<void> {
  const db = initializeFirestore();
  const rows = readCsvFile();

  const docs = rows.map(mapCsvRowToFarmDocument);
  const collectionRef = db.collection(COLLECTION);

  const writes = docs.map((doc) => (batch: admin.firestore.WriteBatch) => {
    batch.set(collectionRef.doc(doc.id), doc.data);
  });

  await commitBatches(db, writes);
  console.log(`Seeded ${docs.length} documents into Firestore collection "${COLLECTION}".`);
}

export async function unseed(): Promise<void> {
  const db = initializeFirestore();
  const rows = readCsvFile();
  const ids = rows.map((row) => {
    const farmName = parseString(row['Farm Name']);
    if (!farmName) {
      throw new Error('Missing required unique field "Farm Name" for row. Each row must include a farm name.');
    }
    return getDeterministicDocId(farmName);
  });

  const collectionRef = db.collection(COLLECTION);
  const writes = ids.map((id) => (batch: admin.firestore.WriteBatch) => {
    batch.delete(collectionRef.doc(id));
  });

  await commitBatches(db, writes);
  console.log(`Deleted ${ids.length} documents from Firestore collection "${COLLECTION}".`);
}

if (require.main === module) {
  const action = process.argv[2]?.toLowerCase();

  if (action === 'seed') {
    seed().catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
  } else if (action === 'unseed') {
    unseed().catch((error) => {
      console.error('Unseed failed:', error);
      process.exit(1);
    });
  } else {
    console.error('Usage: tsx seeders/farmsSeeder.ts seed|unseed');
    process.exit(1);
  }
} 
