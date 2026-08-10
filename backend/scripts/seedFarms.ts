import dotenv from 'dotenv';
dotenv.config();

import { initializeFirebaseAdmin } from '@/utilities/firebaseAdmin';
import { Collections, getFirestore, newId } from '@/utilities/firestore';

async function main() {
  if (!initializeFirebaseAdmin()) {
    throw new Error('Firebase Admin not initialized — check backend/.env credentials');
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const ownerId = 'seed-owner-dev';

  const farms = [
    {
      farm_name: 'Delta Green Acres',
      usda_farm_id: 'SEED-1001',
      primary_phone: '6015550101',
      primary_email: 'delta.green@example.com',
      farm_address: '1200 County Rd 12, Greenville, MS 38701',
      county: 'Washington',
      cities_served: ['Greenville', 'Leland', 'Indianola'],
      location: { lat: 33.4101, lng: -91.0618 },
      seasonal_products: ['Fruits and Vegetables', 'Herbs'],
      meat_products: [] as string[],
      other_products: ['Honey'],
      growing_practices: ['Organic Practices'],
      food_safety_certifications: ['Food Safety Plan in Place'],
      seasonal_products_detail: 'Seasonal greens, tomatoes, and herbs for school cafeterias.',
    },
    {
      farm_name: 'Pine Belt Poultry & Produce',
      usda_farm_id: 'SEED-1002',
      primary_phone: '6015550102',
      primary_email: 'pinebelt@example.com',
      farm_address: '450 Hwy 49, Hattiesburg, MS 39401',
      county: 'Forrest',
      cities_served: ['Hattiesburg', 'Petal'],
      location: { lat: 31.3271, lng: -89.2903 },
      seasonal_products: ['Fruits and Vegetables', 'Dairy and Eggs'],
      meat_products: ['Poultry'],
      other_products: [] as string[],
      growing_practices: ['Conventional'],
      food_safety_certifications: ['GAP Certified'],
      seasonal_products_detail: 'Eggs and leafy greens with weekly school deliveries.',
    },
    {
      farm_name: 'Capitol City Community Farm',
      usda_farm_id: 'SEED-1003',
      primary_phone: '6015550103',
      primary_email: 'capitol.farm@example.com',
      farm_address: '800 Farish St, Jackson, MS 39202',
      county: 'Hinds',
      cities_served: ['Jackson', 'Ridgeland', 'Clinton'],
      location: { lat: 32.2988, lng: -90.1848 },
      seasonal_products: ['Fruits and Vegetables', 'Herbs'],
      meat_products: [] as string[],
      other_products: ['Flowers', 'Seedlings & Plants'],
      growing_practices: ['Regenerative'],
      food_safety_certifications: ['Food Safety Plan in Place'],
      seasonal_products_detail: 'Urban farm supplying Jackson-area schools.',
    },
    {
      farm_name: 'Gulf Coast Fish & Farms Co-op',
      usda_farm_id: 'SEED-1004',
      primary_phone: '2285550104',
      primary_email: 'gulfcoast@example.com',
      farm_address: '2100 Pass Rd, Biloxi, MS 39531',
      county: 'Harrison',
      cities_served: ['Biloxi', 'Gulfport', 'Ocean Springs'],
      location: { lat: 30.396, lng: -88.8853 },
      seasonal_products: ['Fruits and Vegetables'],
      meat_products: ['Fish'],
      other_products: ['Honey'],
      growing_practices: ['Aquaponic'],
      food_safety_certifications: ['GAP Certified'],
      seasonal_products_detail: 'Coastal produce and aquaculture for coastal districts.',
    },
    {
      farm_name: 'Hill Country Cattle & Crops',
      usda_farm_id: 'SEED-1005',
      primary_phone: '6625550105',
      primary_email: 'hillcountry@example.com',
      farm_address: '90 CR 215, Oxford, MS 38655',
      county: 'Lafayette',
      cities_served: ['Oxford', 'University'],
      location: { lat: 34.3665, lng: -89.5192 },
      seasonal_products: ['Fruits and Vegetables', 'Dairy and Eggs'],
      meat_products: ['Beef'],
      other_products: ['Value-Added Products'],
      growing_practices: ['Regenerative'],
      food_safety_certifications: ['Food Safety Plan in Place'],
      seasonal_products_detail: 'Grass-fed beef and farm-stand vegetables.',
    },
  ];

  // Skip farms that already exist with the same USDA id
  const existing = await db.collection(Collections.farms).get();
  const existingUsda = new Set(
    existing.docs.map((d) => (d.data() as { usda_farm_id?: string }).usda_farm_id).filter(Boolean)
  );

  const batch = db.batch();
  const created: string[] = [];

  for (const f of farms) {
    if (existingUsda.has(f.usda_farm_id)) {
      console.log('Skip existing', f.farm_name);
      continue;
    }
    const id = newId();
    created.push(`${f.farm_name} (${id})`);
    batch.set(db.collection(Collections.farms).doc(id), {
      owner_user_id: ownerId,
      usda_farm_id: f.usda_farm_id,
      farm_name: f.farm_name,
      primary_phone: f.primary_phone,
      primary_email: f.primary_email,
      website: null,
      social_media: null,
      farm_address: f.farm_address,
      county: f.county,
      cities_served: f.cities_served,
      location: f.location,
      seasonal_products: f.seasonal_products,
      meat_products: f.meat_products,
      other_products: f.other_products,
      seasonal_products_detail: f.seasonal_products_detail,
      meat_products_detail: null,
      other_products_detail: null,
      market_sales_data: null,
      growing_practices: f.growing_practices,
      food_safety_certifications: f.food_safety_certifications,
      farm_experiences: [],
      farm_characteristics: [],
      farm_to_school_sales: [],
      f2s_experience: 'Available for farm-to-school partnerships.',
      minimum_order: 50,
      delivery_details: 'Delivery available within listed cities.',
      cover_photo: null,
      carousel_photos: [],
      status: 'APPROVED',
      is_archived: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (created.length) {
    await batch.commit();
  }

  console.log(`Seeded ${created.length} approved farms:`);
  for (const row of created) console.log('-', row);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
