<script lang="ts">
	import ColumnFilterDropdown from '$lib/components/admin/farms/ColumnFilterDropdown.svelte';
	import FarmsTableRow from '$lib/components/admin/farms/FarmsTableRow.svelte';
	import {
		FILTER_LABELS,
		FILTER_OPTIONS,
		type AdminFarmRow,
		type FarmColumnFilters,
		type FilterableColumn,
		type SortState,
		type SortableColumn
	} from '$lib/utils/admin-farms';

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
			<div class="farms-table__row farms-table__row--header">
				<div class="farms-table__cell farms-table__cell--check farms-table__cell--pin-check">
					<button
						class="farms-checkbox"
						class:farms-checkbox--checked={allSelected}
						class:farms-checkbox--indeterminate={!allSelected && someSelected}
						type="button"
						aria-label="Select all farms"
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
				</div>
				<div class="farms-table__cell farms-table__cell--header farms-table__cell--pin-name">
					<button
						class="farms-table__header-btn"
						type="button"
						aria-sort={sortDirection('farm_name') === 'asc'
							? 'ascending'
							: sortDirection('farm_name') === 'desc'
								? 'descending'
								: 'none'}
						onclick={() => onToggleSort('farm_name')}
					>
						<span>Farm Name</span>
						<img class="farms-table__header-icon" src="/images/admin/sortIcon.svg" alt="" />
					</button>
				</div>
				<div class="farms-table__cell farms-table__cell--header">
					<button
						class="farms-table__header-btn"
						type="button"
						onclick={() => onToggleSort('primary_email')}
					>
						<span>Email</span>
						<img class="farms-table__header-icon" src="/images/admin/sortIcon.svg" alt="" />
					</button>
				</div>
				<div class="farms-table__cell farms-table__cell--header">
					<button
						class="farms-table__header-btn"
						type="button"
						onclick={() => onToggleSort('farm_address')}
					>
						<span>Address</span>
						<img class="farms-table__header-icon" src="/images/admin/sortIcon.svg" alt="" />
					</button>
				</div>
				<div class="farms-table__cell farms-table__cell--header">
					<button
						class="farms-table__header-btn"
						type="button"
						onclick={() => onToggleSort('primary_phone')}
					>
						<span>Phone Number</span>
						<img class="farms-table__header-icon" src="/images/admin/sortIcon.svg" alt="" />
					</button>
				</div>

				{#each Object.keys(FILTER_OPTIONS) as key (key)}
					{@const column = key as FilterableColumn}
					<div class="farms-table__cell farms-table__cell--header">
						<ColumnFilterDropdown
							{column}
							label={FILTER_LABELS[column]}
							options={FILTER_OPTIONS[column]}
							selected={filters[column]}
							open={openFilter === column}
							onToggle={() => (openFilter = openFilter === column ? null : column)}
							onChange={(next) => setFilter(column, next)}
						/>
					</div>
				{/each}

				<div class="farms-table__cell farms-table__cell--header">
					<span class="farms-table__header-label">Seasonal Produce</span>
				</div>
				<div class="farms-table__cell farms-table__cell--header">
					<span class="farms-table__header-label">Agritourism</span>
				</div>
				<div class="farms-table__cell farms-table__cell--header">
					<span class="farms-table__header-label">Farmers Markets</span>
				</div>
				<div class="farms-table__cell farms-table__cell--header">
					<span class="farms-table__header-label">Experience</span>
				</div>
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
