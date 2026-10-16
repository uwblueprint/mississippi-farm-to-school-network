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

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Maps a farm to its spreadsheet row, keyed by the column header shown in Excel. */
export function formatFarmForExport(farm: AdminFarmRow) {
	return {
		'Farm Name': farm.farm_name,
		Email: farm.primary_email,
		Address: farm.farm_address,
		'Phone Number': farm.primary_phone,
		'Growing Practices': farm.growing_practices.join(', '),
		Characteristics: farm.farm_characteristics.map(shortCharacteristic).join(', '),
		Certifications: farm.food_safety_certifications.join(', '),
		'CSA Boxes': yesNoLabel(hasOption(farm.farm_experiences, CSA_EXPERIENCE)),
		'Online Sales': yesNoLabel(hasOption(farm.farm_to_school_sales, ONLINE_SALES_OPTION)),
		Delivery: yesNoLabel(hasOption(farm.farm_to_school_sales, DELIVERY_OPTION)),
		Interest: formatInterest(farm.farm_to_school_sales, ''),
		'Seasonal Produce': formatSeasonalProduce(farm, ''),
		Agritourism: formatAgritourism(farm, ''),
		'Farmers Markets': formatFarmersMarkets(farm, ''),
		Experience: formatExperience(farm, '')
	};
}

export type FarmExportRow = ReturnType<typeof formatFarmForExport>;

// Key order here sets the column order in the sheet.
const COLUMN_WIDTHS: Record<keyof FarmExportRow, number> = {
	'Farm Name': 30,
	Email: 30,
	Address: 40,
	'Phone Number': 16,
	'Growing Practices': 30,
	Characteristics: 30,
	Certifications: 30,
	'CSA Boxes': 12,
	'Online Sales': 12,
	Delivery: 12,
	Interest: 18,
	'Seasonal Produce': 40,
	Agritourism: 30,
	'Farmers Markets': 30,
	Experience: 40
};

export async function buildFarmsXlsx(farms: AdminFarmRow[]): Promise<Blob> {
	// Loaded on demand so exceljs (~1 MB) stays out of the initial admin bundle.
	const { default: ExcelJS } = await import('exceljs');

	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Farms', { views: [{ state: 'frozen', ySplit: 1 }] });

	// Every cell is written as a plain string, so Excel keeps phone numbers as typed and
	// never evaluates user-supplied values as formulas.
	sheet.columns = Object.entries(COLUMN_WIDTHS).map(([header, width]) => ({
		header,
		key: header,
		width
	}));
	sheet.getRow(1).font = { bold: true };
	sheet.addRows(farms.map(formatFarmForExport));

	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], { type: XLSX_MIME_TYPE });
}

export async function downloadFarmsXlsx(
	farms: AdminFarmRow[],
	filename = 'farms-export.xlsx'
): Promise<void> {
	const blob = await buildFarmsXlsx(farms);
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	// Revoke on the next tick; revoking synchronously can cancel the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
