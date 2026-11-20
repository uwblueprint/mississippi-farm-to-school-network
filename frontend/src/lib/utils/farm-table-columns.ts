import { getFarmTags } from '$lib/utils/farm-tags';
import {
	CSA_EXPERIENCE,
	DELIVERY_OPTION,
	FILTER_LABELS,
	ONLINE_SALES_OPTION,
	formatFarmersMarkets,
	formatInterest,
	formatProductLines,
	hasOption,
	joinList,
	plain,
	productLines,
	shortCharacteristic,
	socialText,
	withOtherAnswer,
	yesNoLabel,
	type AdminFarmRow,
	type FilterableColumn,
	type ProductLine,
	type SortableColumn
} from '$lib/utils/admin-farms';

export type FarmTableColumn = {
	key: string;
	label: string;
	width: string;
	pin?: 'check' | 'name';
	sortable?: SortableColumn;
	filter?: FilterableColumn;
	text: (farm: AdminFarmRow) => string;
	products?: (farm: AdminFarmRow) => ProductLine[];
	pills?: (farm: AdminFarmRow) => string[];
	pillTone?: 'green' | 'purple' | 'orange';
	pillFormat?: (value: string) => string;
};

export const FARM_TABLE_COLUMNS: FarmTableColumn[] = [
	{
		key: 'check',
		label: '',
		width: '4rem',
		pin: 'check',
		text: () => ''
	},
	{
		key: 'farm_name',
		label: 'Farm Name',
		width: '13rem',
		pin: 'name',
		sortable: 'farm_name',
		text: (farm) => farm.farm_name
	},
	{
		key: 'about_us',
		label: 'About Us',
		width: '16rem',
		text: (farm) => plain(farm.about_us)
	},
	{
		key: 'primary_contact_name',
		label: 'Primary Contact',
		width: '12rem',
		text: (farm) => plain(farm.primary_contact_name)
	},
	{
		key: 'primary_phone',
		label: 'Phone Number',
		width: '10rem',
		sortable: 'primary_phone',
		text: (farm) => farm.primary_phone
	},
	{
		key: 'primary_email',
		label: 'Email Address',
		width: '16rem',
		sortable: 'primary_email',
		text: (farm) => farm.primary_email
	},
	{
		key: 'farm_address',
		label: 'Farm Address',
		width: '18rem',
		sortable: 'farm_address',
		text: (farm) => farm.farm_address
	},
	{
		key: 'county',
		label: 'County',
		width: '10rem',
		text: (farm) => plain(farm.county)
	},
	{
		key: 'usda_farm_id',
		label: 'Farm Number',
		width: '10rem',
		text: (farm) => plain(farm.usda_farm_id)
	},
	{
		key: 'website',
		label: 'Website',
		width: '14rem',
		text: (farm) => plain(farm.website)
	},
	{
		key: 'instagram',
		label: 'Instagram',
		width: '12rem',
		text: (farm) => socialText(farm, 'instagram')
	},
	{
		key: 'facebook',
		label: 'Facebook',
		width: '14rem',
		text: (farm) => socialText(farm, 'facebook')
	},
	{
		key: 'other_social',
		label: 'Other Social Media',
		width: '14rem',
		text: (farm) => socialText(farm, 'other')
	},
	{
		key: 'cities_served',
		label: 'Cities Served',
		width: '14rem',
		text: (farm) => joinList(farm.cities_served)
	},
	{
		key: 'growing_practices',
		label: FILTER_LABELS.growing_practices,
		width: '14rem',
		filter: 'growing_practices',
		pillTone: 'green',
		pills: (farm) => withOtherAnswer(farm.growing_practices, farm.growing_practices_other),
		text: (farm) => joinList(withOtherAnswer(farm.growing_practices, farm.growing_practices_other))
	},
	{
		key: 'seasonal_products',
		label: 'Seasonal Products',
		width: '16rem',
		products: (farm) => productLines(farm.seasonal_products, farm.seasonal_products_detail),
		text: (farm) =>
			formatProductLines(productLines(farm.seasonal_products, farm.seasonal_products_detail))
	},
	{
		key: 'meat_products',
		label: 'Meat Products',
		width: '14rem',
		products: (farm) => productLines(farm.meat_products, farm.meat_products_detail),
		text: (farm) => formatProductLines(productLines(farm.meat_products, farm.meat_products_detail))
	},
	{
		key: 'other_products',
		label: 'Other Products',
		width: '14rem',
		products: (farm) => productLines(farm.other_products, farm.other_products_detail),
		text: (farm) =>
			formatProductLines(productLines(farm.other_products, farm.other_products_detail))
	},
	{
		key: 'food_safety_certifications',
		label: FILTER_LABELS.food_safety_certifications,
		width: '18rem',
		filter: 'food_safety_certifications',
		pillTone: 'orange',
		pills: (farm) => withOtherAnswer(farm.food_safety_certifications, farm.food_safety_other),
		text: (farm) =>
			joinList(withOtherAnswer(farm.food_safety_certifications, farm.food_safety_other))
	},
	{
		key: 'farm_experiences',
		label: 'Farm Experiences & Services',
		width: '16rem',
		text: (farm) => joinList(farm.farm_experiences)
	},
	{
		key: 'csa_boxes',
		label: FILTER_LABELS.csa_boxes,
		width: '11rem',
		filter: 'csa_boxes',
		text: (farm) => yesNoLabel(hasOption(farm.farm_experiences, CSA_EXPERIENCE))
	},
	{
		key: 'farmers_markets',
		label: 'Farmers Markets Served',
		width: '16rem',
		text: (farm) => formatFarmersMarkets(farm)
	},
	{
		key: 'farm_characteristics',
		label: FILTER_LABELS.farm_characteristics,
		width: '14rem',
		filter: 'farm_characteristics',
		pillTone: 'purple',
		pillFormat: shortCharacteristic,
		pills: (farm) => farm.farm_characteristics,
		text: (farm) => farm.farm_characteristics.map(shortCharacteristic).join('; ')
	},
	{
		key: 'institution_type',
		label: 'Institution Type',
		width: '14rem',
		text: (farm) => getFarmTags(farm).join(', ')
	},
	{
		key: 'interest',
		label: FILTER_LABELS.interest,
		width: '17rem',
		filter: 'interest',
		text: (farm) => formatInterest(farm.farm_to_school_sales)
	},
	{
		key: 'online_sales',
		label: FILTER_LABELS.online_sales,
		width: '15rem',
		filter: 'online_sales',
		text: (farm) => yesNoLabel(hasOption(farm.farm_to_school_sales, ONLINE_SALES_OPTION))
	},
	{
		key: 'delivery',
		label: FILTER_LABELS.delivery,
		width: '13rem',
		filter: 'delivery',
		text: (farm) => yesNoLabel(hasOption(farm.farm_to_school_sales, DELIVERY_OPTION))
	},
	{
		key: 'f2s_experience',
		label: 'Previous Farm to School or ECE Experience',
		width: '22rem',
		text: (farm) => plain(farm.f2s_experience)
	},
	{
		key: 'minimum_order',
		label: 'Minimum Order for Schools/ECEs',
		width: '16rem',
		text: (farm) => plain(farm.minimum_order)
	},
	{
		key: 'delivery_details',
		label: 'Delivery Details (area, fees, minimums)',
		width: '18rem',
		text: (farm) => plain(farm.delivery_details)
	}
];

export const FARM_TABLE_GRID = FARM_TABLE_COLUMNS.map((column) => column.width).join(' ');
