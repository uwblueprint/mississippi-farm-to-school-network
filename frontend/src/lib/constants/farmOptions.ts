// Frontend mirror of backend/constants/farmOptions.ts — the allowed values for
// the farm string-array fields. The backend validates submissions against its
// copy (assertAllowedValues), so these lists must stay character-identical.
//
// NONE_OF_THE_ABOVE is kept separate: the backend accepts it for
// growing_practices and food_safety_certifications, and the forms append it
// with mutual-exclusion handling rather than treating it as a normal option.

export const NONE_OF_THE_ABOVE = 'None of the above';

export const GROWING_PRACTICES = [
	'Organic Practices',
	'Conventional',
	'Regenerative',
	'Hydroponic',
	'Aquaponic',
	'Biodynamic'
];

export const SEASONAL_PRODUCTS = ['Fruits and Vegetables', 'Dairy and Eggs', 'Herbs'];

export const MEAT_PRODUCTS = ['Beef', 'Poultry', 'Fish', 'Other'];

export const OTHER_PRODUCTS = [
	'Honey',
	'Mushrooms',
	'Flowers',
	'Seedlings & Plants',
	'Grains',
	'Value-Added Products',
	'Other'
];

export const FOOD_SAFETY_CERTIFICATIONS = [
	'Food Safety Plan in Place',
	'GAP Certified',
	'Certified Organic',
	'Certified Naturally Grown'
];

export const FARM_EXPERIENCES = [
	'CSA (Community Supported Agriculture) Available',
	'U-Pick Available',
	'Farm Stand On-Site',
	'Farm Tours/Field Trips Welcome',
	'Equipment Rental Available'
];

export const FARM_CHARACTERISTICS = [
	'BIPOC-Owned Farm',
	'Veteran-Owned Farm',
	'Woman-Owned Farm',
	'Multi-Generational Farm',
	'Beginning Farmer (10 years or less in farming)',
	'Young Farmer (Age 40 or Under)'
];

export const FARM_TO_SCHOOL_SALES = [
	'Interested in Selling to K-12 Schools',
	'Interested in Selling to Early Care and Education Programs',
	'Online Ordering Available',
	'Delivery Available'
];
