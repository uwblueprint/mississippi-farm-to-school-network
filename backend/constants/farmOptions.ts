export const NONE_OF_THE_ABOVE = 'None of the above';

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

export const SEASONAL_PRODUCTS = ['Fruits and Vegetables', 'Dairy and Eggs', 'Herbs'] as const;
export type SeasonalProduct = (typeof SEASONAL_PRODUCTS)[number];

export const MEAT_PRODUCTS = ['Beef', 'Poultry', 'Fish', 'Other'] as const;
export type MeatProduct = (typeof MEAT_PRODUCTS)[number];

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

export const FOOD_SAFETY_CERTIFICATIONS = [
  'Food Safety Plan in Place',
  'GAP Certified',
  'Certified Organic',
  'Certified Naturally Grown',
  NONE_OF_THE_ABOVE,
] as const;
export type FoodSafetyCertification = (typeof FOOD_SAFETY_CERTIFICATIONS)[number];

export const FARM_EXPERIENCES = [
  'CSA (Community Supported Agriculture) Available',
  'U-Pick Available',
  'Farm Stand On-Site',
  'Farm Tours/Field Trips Welcome',
  'Equipment Rental Available',
] as const;
export type FarmExperience = (typeof FARM_EXPERIENCES)[number];

export const FARM_CHARACTERISTICS = [
  'BIPOC-Owned Farm',
  'Veteran-Owned Farm',
  'Woman-Owned Farm',
  'Multi-Generational Farm',
  'Beginning Farmer (10 years or less in farming)',
  'Young Farmer (Age 40 or Under)',
] as const;
export type FarmCharacteristic = (typeof FARM_CHARACTERISTICS)[number];

export const FARM_TO_SCHOOL_SALES = [
  'Interested in Selling to K-12 Schools',
  'Interested in Selling to Early Care and Education Programs',
  'Online Ordering Available',
  'Delivery Available',
] as const;
export type FarmToSchoolSale = (typeof FARM_TO_SCHOOL_SALES)[number];

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
