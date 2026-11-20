<script lang="ts">
	import FarmValuePills from '$lib/components/admin/farms/FarmValuePills.svelte';
	import ProductDetailCell from '$lib/components/admin/farms/ProductDetailCell.svelte';
	import type { AdminFarmRow } from '$lib/utils/admin-farms';
	import { FARM_TABLE_COLUMNS, FARM_TABLE_GRID } from '$lib/utils/farm-table-columns';

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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	class="farms-table__row farms-table__row--clickable"
	class:farms-table__row--zebra={index % 2 === 0}
	class:farms-table__row--selected={selected}
	class:farms-table__row--hovered={hovered}
	style:grid-template-columns={FARM_TABLE_GRID}
	onmouseenter={() => onHover(farm.id)}
	onmouseleave={() => onHover(null)}
	onclick={() => onRowClick(farm.id)}
>
	{#each FARM_TABLE_COLUMNS as column (column.key)}
		<div
			class="farms-table__cell"
			class:farms-table__cell--check={column.pin === 'check'}
			class:farms-table__cell--pin-check={column.pin === 'check'}
			class:farms-table__cell--pin-name={column.pin === 'name'}
		>
			{#if column.pin === 'check'}
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
			{:else if column.products}
				<ProductDetailCell items={column.products(farm)} />
			{:else if column.pills}
				<FarmValuePills
					values={column.pills(farm)}
					tone={column.pillTone}
					formatLabel={column.pillFormat}
				/>
			{:else}
				{@const value = column.text(farm)}
				<span class="farms-table__text farms-table__text--clamp" title={value || undefined}
					>{value || '—'}</span
				>
			{/if}
		</div>
	{/each}
</div>
