import {
	CSA_EXPERIENCE,
	DELIVERY_OPTION,
	ONLINE_SALES_OPTION,
	formatAgritourism,
	formatExperience,
	formatFarmersMarkets,
	formatInterest,
	formatSeasonalProduce,
	hasOption,
	shortCharacteristic,
	yesNoLabel,
	type AdminFarmRow
} from '$lib/utils/admin-farms';

const CSV_HEADERS = [
	'Farm Name',
	'Email',
	'Address',
	'Phone Number',
	'Growing Practices',
	'Characteristics',
	'Certifications',
	'CSA Boxes',
	'Online Sales',
	'Delivery',
	'Interest',
	'Seasonal Produce',
	'Agritourism',
	'Farmers Markets',
	'Experience'
] as const;

function escapeCsvCell(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function farmToRow(farm: AdminFarmRow): string[] {
	return [
		farm.farm_name,
		farm.primary_email,
		farm.farm_address,
		farm.primary_phone,
		farm.growing_practices.join('; '),
		farm.farm_characteristics.map(shortCharacteristic).join('; '),
		farm.food_safety_certifications.join('; '),
		yesNoLabel(hasOption(farm.farm_experiences, CSA_EXPERIENCE)),
		yesNoLabel(hasOption(farm.farm_to_school_sales, ONLINE_SALES_OPTION)),
		yesNoLabel(hasOption(farm.farm_to_school_sales, DELIVERY_OPTION)),
		formatInterest(farm.farm_to_school_sales),
		formatSeasonalProduce(farm),
		formatAgritourism(farm),
		formatFarmersMarkets(farm),
		formatExperience(farm)
	];
}

export function buildFarmsCsv(farms: AdminFarmRow[]): string {
	const lines = [
		CSV_HEADERS.join(','),
		...farms.map((farm) => farmToRow(farm).map(escapeCsvCell).join(','))
	];
	return lines.join('\r\n');
}

export function downloadFarmsCsv(farms: AdminFarmRow[], filename = 'farms-export.csv'): void {
	const csv = buildFarmsCsv(farms);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
