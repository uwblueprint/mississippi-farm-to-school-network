// Shared "none" option used by growing practices and food safety certifications.
export const NONE_OF_THE_ABOVE = 'None of the above';

// Allowed growing-practice values for farm profiles.
export const GROWING_PRACTICES = [
  'Organic Practices',
  'Conventional',
  'Regenerative',
  'Hydroponic',
  'Aquaponic',
  'Biodynamic',
  NONE_OF_THE_ABOVE,
] as const;
export type GrowingPractice = (typeof GROWING_PRACTICES)[number];

// Seasonal product categories a farm can offer.
export const SEASONAL_PRODUCTS = ['Fruits and Vegetables', 'Dairy and Eggs', 'Herbs'] as const;
export type SeasonalProduct = (typeof SEASONAL_PRODUCTS)[number];

// Meat product options for farm listings.
export const MEAT_PRODUCTS = ['Beef', 'Poultry', 'Fish', 'Other'] as const;
export type MeatProduct = (typeof MEAT_PRODUCTS)[number];

// Non-seasonal / non-meat product options.
export const OTHER_PRODUCTS = [
  'Honey',
  'Mushrooms',
  'Flowers',
  'Seedlings & Plants',
  'Grains',
  'Value-Added Products',
  'Other',
] as const;
export type OtherProduct = (typeof OTHER_PRODUCTS)[number];

// Food safety and certification options.
export const FOOD_SAFETY_CERTIFICATIONS = [
  'Food Safety Plan in Place',
  'GAP Certified',
  'Certified Organic',
  'Certified Naturally Grown',
  NONE_OF_THE_ABOVE,
] as const;
export type FoodSafetyCertification = (typeof FOOD_SAFETY_CERTIFICATIONS)[number];

// On-farm experiences a farm can advertise.
export const FARM_EXPERIENCES = [
  'CSA (Community Supported Agriculture) Available',
  'U-Pick Available',
  'Farm Stand On-Site',
  'Farm Tours/Field Trips Welcome',
  'Equipment Rental Available',
] as const;
export type FarmExperience = (typeof FARM_EXPERIENCES)[number];

// Demographic / ownership characteristics for farm profiles.
export const FARM_CHARACTERISTICS = [
  'BIPOC-Owned Farm',
  'Veteran-Owned Farm',
  'Woman-Owned Farm',
  'Multi-Generational Farm',
  'Beginning Farmer (10 years or less in farming)',
  'Young Farmer (Age 40 or Under)',
] as const;
export type FarmCharacteristic = (typeof FARM_CHARACTERISTICS)[number];

// Farm-to-school sales and fulfillment options.
export const FARM_TO_SCHOOL_SALES = [
  'Interested in Selling to K-12 Schools',
  'Interested in Selling to Early Care and Education Programs',
  'Online Ordering Available',
  'Delivery Available',
] as const;
export type FarmToSchoolSale = (typeof FARM_TO_SCHOOL_SALES)[number];

// Validates that submitted values are in the allowed option list.
export const assertAllowedValues = <T extends string>(
  values: string[],
  allowed: readonly T[],
  field: string
): T[] => {
  const allowedSet = new Set<string>(allowed);
  const invalid = values.filter((value) => !allowedSet.has(value));

  if (invalid.length > 0) {
    throw new Error(`Invalid ${field}: ${invalid.join(', ')}`);
  }

  return values as T[];
};
