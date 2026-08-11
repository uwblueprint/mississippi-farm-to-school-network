import type { PendingFarmDto } from '$lib/types/admin';

export type ReviewField =
	| { kind: 'text'; label?: string; value: string | null | undefined }
	| { kind: 'list'; label?: string; values: string[] | null | undefined };

export type ReviewSection = {
	title: string;
	fields: ReviewField[];
};

function joinList(values: string[]): string {
	return values.join(', ');
}

function nonEmptyText(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function nonEmptyList(values: string[] | null | undefined): string[] | null {
	if (!values?.length) return null;
	return values;
}

function detailOrList(
	detail: string | null | undefined,
	list: string[] | null | undefined
): string | null {
	return nonEmptyText(detail) ?? (nonEmptyList(list) ? joinList(list!) : null);
}

/** Build review sections for the admin modal; empty fields/sections are omitted. */
export function buildReviewSections(farm: PendingFarmDto): ReviewSection[] {
	const minimumOrderLabel =
		farm.minimum_order != null ? `$${farm.minimum_order} minimum order.` : null;

	const marketSales = farm.market_sales_data?.length
		? farm.market_sales_data.map((entry) => `${entry.market} (${entry.times})`).join('; ')
		: null;

	const sections: ReviewSection[] = [
		{
			title: 'About',
			fields: [{ kind: 'list', label: 'Growing Practices', values: farm.growing_practices }]
		},
		{
			title: 'Products Offered',
			fields: [
				{
					kind: 'text',
					label: 'Seasonal Produce',
					value: detailOrList(farm.seasonal_products_detail, farm.seasonal_products)
				},
				{
					kind: 'text',
					label: 'Meat',
					value: detailOrList(farm.meat_products_detail, farm.meat_products)
				},
				{
					kind: 'text',
					label: 'Other',
					value: detailOrList(farm.other_products_detail, farm.other_products)
				}
			]
		},
		{
			title: 'Food Safety & Certifications',
			fields: [
				{
					kind: 'list',
					label: 'Food Safety Certifications',
					values: farm.food_safety_certifications
				}
			]
		},
		{
			title: 'Farm Experiences & Services',
			fields: [{ kind: 'list', values: farm.farm_experiences }]
		},
		{
			title: 'Farm Characteristics',
			fields: [
				{
					kind: 'list',
					label: 'Farm Characteristics',
					values: farm.farm_characteristics
				}
			]
		},
		{
			title: 'Farm to School Sales',
			fields: [
				{ kind: 'list', values: farm.farm_to_school_sales },
				{
					kind: 'text',
					label: 'Farm to School Experience',
					value: farm.f2s_experience
				},
				{
					kind: 'text',
					label: 'Delivery Capabilities',
					value: farm.delivery_details
				},
				{
					kind: 'text',
					label: 'Minimum Order Requirements',
					value: minimumOrderLabel
				},
				{ kind: 'text', label: 'Market Sales', value: marketSales }
			]
		}
	];

	return sections
		.map((section) => ({
			...section,
			fields: section.fields.filter((field) => {
				if (field.kind === 'list') return Boolean(nonEmptyList(field.values));
				return Boolean(nonEmptyText(field.value));
			})
		}))
		.filter((section) => section.fields.length > 0);
}
