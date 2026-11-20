import { FARM_TABLE_COLUMNS } from '$lib/utils/farm-table-columns';
import type { AdminFarmRow } from '$lib/utils/admin-farms';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const EXPORT_COLUMNS = FARM_TABLE_COLUMNS.filter((column) => column.key !== 'check');

/** Maps a farm to its spreadsheet row, keyed by the column header shown in Excel. */
export function formatFarmForExport(farm: AdminFarmRow): Record<string, string> {
	const row: Record<string, string> = {};
	for (const column of EXPORT_COLUMNS) {
		row[column.label] = column.text(farm);
	}
	return row;
}

export type FarmExportRow = ReturnType<typeof formatFarmForExport>;

export async function buildFarmsXlsx(farms: AdminFarmRow[]): Promise<Blob> {
	// Loaded on demand so exceljs (~1 MB) stays out of the initial admin bundle.
	const { default: ExcelJS } = await import('exceljs');

	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Farms', { views: [{ state: 'frozen', ySplit: 1 }] });

	// Every cell is written as a plain string, so Excel keeps phone numbers as typed and
	// never evaluates user-supplied values as formulas.
	sheet.columns = EXPORT_COLUMNS.map((column) => ({
		header: column.label,
		key: column.label,
		width: Math.max(12, Math.min(40, Math.round(parseFloat(column.width) * 1.5) || 20))
	}));
	sheet.getRow(1).font = { bold: true };
	sheet.addRows(farms.map(formatFarmForExport));

	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], { type: XLSX_MIME_TYPE });
}

/** e.g. "farms-export-2026-10-15-2251.xlsx", in the admin's local time. */
export function defaultExportFilename(now = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
	return `farms-export-${date}-${time}.xlsx`;
}

export async function downloadFarmsXlsx(
	farms: AdminFarmRow[],
	filename = defaultExportFilename()
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
