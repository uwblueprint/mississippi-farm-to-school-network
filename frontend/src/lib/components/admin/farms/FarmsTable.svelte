<script lang="ts">
	import ColumnFilterDropdown from '$lib/components/admin/farms/ColumnFilterDropdown.svelte';
	import FarmsTableRow from '$lib/components/admin/farms/FarmsTableRow.svelte';
	import {
		FILTER_OPTIONS,
		type FarmColumnFilters,
		type FilterableColumn
	} from '$lib/utils/admin-farms';
	import type { AdminFarmRow, SortState, SortableColumn } from '$lib/utils/admin-farms';
	import { FARM_TABLE_COLUMNS, FARM_TABLE_GRID } from '$lib/utils/farm-table-columns';

	interface Props {
		farms: AdminFarmRow[];
		selectedIds: Set<string>;
		sort: SortState;
		filters: FarmColumnFilters;
		emptyMessage: string;
		onToggleSort: (column: SortableColumn) => void;
		onToggleSelect: (id: string) => void;
		onToggleSelectAll: () => void;
		onFiltersChange: (filters: FarmColumnFilters) => void;
		onRowClick: (id: string) => void;
		allSelected: boolean;
		someSelected: boolean;
	}

	let {
		farms,
		selectedIds,
		sort,
		filters,
		emptyMessage,
		onToggleSort,
		onToggleSelect,
		onToggleSelectAll,
		onFiltersChange,
		onRowClick,
		allSelected,
		someSelected
	}: Props = $props();

	let openFilter: FilterableColumn | null = $state(null);
	let hoveredFarmId = $state<string | null>(null);

	function sortDirection(column: SortableColumn): 'asc' | 'desc' | null {
		return sort?.column === column ? sort.direction : null;
	}

	function setFilter(column: FilterableColumn, values: string[]) {
		onFiltersChange({ ...filters, [column]: values });
	}
</script>

<div
	class="farms-table"
	class:farms-table--empty={farms.length === 0}
	role="region"
	aria-label="Farms table"
>
	<div class="farms-table__scroll">
		<div class="farms-table__grid">
			<div
				class="farms-table__row farms-table__row--header"
				style:grid-template-columns={FARM_TABLE_GRID}
			>
				{#each FARM_TABLE_COLUMNS as column (column.key)}
					<div
						class="farms-table__cell"
						class:farms-table__cell--header={column.key !== 'check'}
						class:farms-table__cell--check={column.pin === 'check'}
						class:farms-table__cell--pin-check={column.pin === 'check'}
						class:farms-table__cell--pin-name={column.pin === 'name'}
						role={column.sortable ? 'columnheader' : undefined}
						aria-sort={column.sortable
							? sortDirection(column.sortable) === 'asc'
								? 'ascending'
								: sortDirection(column.sortable) === 'desc'
									? 'descending'
									: 'none'
							: undefined}
					>
						{#if column.pin === 'check'}
							<button
								class="farms-checkbox"
								class:farms-checkbox--checked={allSelected}
								class:farms-checkbox--indeterminate={!allSelected && someSelected}
								type="button"
								aria-label="Select all farms on every page"
								aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
								role="checkbox"
								onclick={onToggleSelectAll}
							>
								{#if allSelected}
									<img src="/images/admin/checkboxCheckIcon.svg" alt="" />
								{:else if someSelected}
									<span class="farms-checkbox__dash"></span>
								{/if}
							</button>
						{:else if column.filter}
							<ColumnFilterDropdown
								column={column.filter}
								label={column.label}
								options={FILTER_OPTIONS[column.filter]}
								selected={filters[column.filter]}
								open={openFilter === column.filter}
								onToggle={() => (openFilter = openFilter === column.filter ? null : column.filter!)}
								onChange={(next) => setFilter(column.filter!, next)}
							/>
						{:else if column.sortable}
							<button
								class="farms-table__header-btn"
								type="button"
								onclick={() => onToggleSort(column.sortable!)}
							>
								<span>{column.label}</span>
								<img class="farms-table__header-icon" src="/images/admin/sortIcon.svg" alt="" />
							</button>
						{:else}
							<span class="farms-table__header-label">{column.label}</span>
						{/if}
					</div>
				{/each}
			</div>

			{#each farms as farm, index (farm.id)}
				<FarmsTableRow
					{farm}
					{index}
					selected={selectedIds.has(farm.id)}
					hovered={hoveredFarmId === farm.id}
					{onRowClick}
					{onToggleSelect}
					onHover={(id) => (hoveredFarmId = id)}
				/>
			{/each}
		</div>

		{#if farms.length === 0}
			<div class="farms-table__empty">
				<p>{emptyMessage}</p>
			</div>
		{/if}
	</div>
</div>
