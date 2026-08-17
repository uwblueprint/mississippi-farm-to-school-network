<script lang="ts">
	import FarmValuePills from '$lib/components/admin/farms/FarmValuePills.svelte';
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

	interface Props {
		farm: AdminFarmRow;
		index: number;
		selected: boolean;
		hovered: boolean;
		onRowClick: (id: string) => void;
		onToggleSelect: (id: string) => void;
		onHover: (id: string | null) => void;
	}

	let { farm, index, selected, hovered, onRowClick, onToggleSelect, onHover }: Props = $props();

	function handleCheckboxClick(event: MouseEvent) {
		event.stopPropagation();
		onToggleSelect(farm.id);
	}

	const seasonalProduce = $derived(formatSeasonalProduce(farm));
	const agritourism = $derived(formatAgritourism(farm));
	const farmersMarkets = $derived(formatFarmersMarkets(farm));
	const experience = $derived(formatExperience(farm));
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	class="farms-table__row farms-table__row--clickable"
	class:farms-table__row--zebra={index % 2 === 0}
	class:farms-table__row--selected={selected}
	class:farms-table__row--hovered={hovered}
	onmouseenter={() => onHover(farm.id)}
	onmouseleave={() => onHover(null)}
	onclick={() => onRowClick(farm.id)}
>
	<div class="farms-table__cell farms-table__cell--check farms-table__cell--pin-check">
		<button
			class="farms-checkbox"
			class:farms-checkbox--checked={selected}
			type="button"
			aria-label={`Select ${farm.farm_name}`}
			aria-checked={selected}
			role="checkbox"
			onclick={handleCheckboxClick}
		>
			{#if selected}
				<img src="/images/admin/checkboxCheckIcon.svg" alt="" />
			{/if}
		</button>
	</div>
	<div class="farms-table__cell farms-table__cell--pin-name">
		<span class="farms-table__text" title={farm.farm_name}>{farm.farm_name}</span>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text" title={farm.primary_email}>{farm.primary_email}</span>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text" title={farm.farm_address}>{farm.farm_address}</span>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text" title={farm.primary_phone}>{farm.primary_phone}</span>
	</div>
	<div class="farms-table__cell">
		<FarmValuePills values={farm.growing_practices} tone="green" />
	</div>
	<div class="farms-table__cell">
		<FarmValuePills
			values={farm.farm_characteristics}
			tone="purple"
			formatLabel={shortCharacteristic}
		/>
	</div>
	<div class="farms-table__cell">
		<FarmValuePills values={farm.food_safety_certifications} tone="orange" />
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text"
			>{yesNoLabel(hasOption(farm.farm_experiences, CSA_EXPERIENCE))}</span
		>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text"
			>{yesNoLabel(hasOption(farm.farm_to_school_sales, ONLINE_SALES_OPTION))}</span
		>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text"
			>{yesNoLabel(hasOption(farm.farm_to_school_sales, DELIVERY_OPTION))}</span
		>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text">{formatInterest(farm.farm_to_school_sales)}</span>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text farms-table__text--clamp" title={seasonalProduce}
			>{seasonalProduce}</span
		>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text farms-table__text--clamp" title={agritourism}>{agritourism}</span
		>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text farms-table__text--clamp" title={farmersMarkets}
			>{farmersMarkets}</span
		>
	</div>
	<div class="farms-table__cell">
		<span class="farms-table__text farms-table__text--clamp" title={experience}>{experience}</span>
	</div>
</div>
