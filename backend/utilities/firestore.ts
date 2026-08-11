import { randomUUID } from 'node:crypto';
import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

/** Firestore collection names for app data (replaces Postgres tables). */
export const Collections = {
  users: 'users',
  farms: 'farms',
  farmRejections: 'farm_rejections',
  announcements: 'announcements',
  images: 'images',
  storedFiles: 'stored_files',
  // Enforces usda_farm_id uniqueness: doc id is the usda_farm_id value itself, so
  // Firestore's per-document transaction conflict detection can guard against races
  // (a query-based "does a doc with this field value exist" check can't be, since
  // Firestore transactions don't detect a new document being added that newly matches
  // a query that previously returned no results).
  farmUsdaIds: 'farm_usda_ids',
} as const;

export type FirestoreLocation = { lat: number; lng: number };

let cachedDb: Firestore | null = null;

/** Returns the Admin Firestore client. Requires Firebase Admin to be initialized. */
export function getFirestore(): Firestore {
  if (!cachedDb) {
    if (!admin.apps.length) {
      throw new Error(
        'Firebase Admin is not initialized. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SVC_ACCOUNT_* in backend/.env'
      );
    }
    cachedDb = admin.firestore();
  }
  return cachedDb;
}

export function newId(): string {
  return randomUUID();
}

export function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const ts = value as { toDate: () => Date };
    return ts.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }
  throw new Error(`toIso: expected a Date, Firestore Timestamp, or string, got ${typeof value}`);
}

export function toDate(value: unknown): Date {
  return new Date(toIso(value));
}

/** Earth-surface distance in km (Haversine). Replaces PostGIS ST_Distance for proximity. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function arraysOverlap(
  a: string[] | undefined | null,
  b: string[] | undefined | null
): boolean {
  if (!a?.length || !b?.length) return false;
  const set = new Set(a);
  return b.some((item) => set.has(item));
}
