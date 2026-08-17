<script lang="ts">
	import ColumnFilterDropdown from '$lib/components/admin/farms/ColumnFilterDropdown.svelte';
	import FarmValuePills from '$lib/components/admin/farms/FarmValuePills.svelte';
	import {
		CSA_EXPERIENCE,
		DELIVERY_OPTION,
		FILTER_LABELS,
		FILTER_OPTIONS,
		ONLINE_SALES_OPTION,
		formatAgritourism,
		formatExperience,
		formatFarmersMarkets,
		formatInterest,
		formatSeasonalProduce,
		hasOption,
		shortCharacteristic,
		yesNoLabel,
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

	function handleCheckboxClick(event: MouseEvent, id: string) {
		event.stopPropagation();
		onToggleSelect(id);
	}

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
		<div class="farms-table__pinned">
			<div class="farms-table__row farms-table__row--header">
				<div class="farms-table__cell farms-table__cell--check">
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
				<div class="farms-table__cell farms-table__cell--header">
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
			</div>

			{#each farms as farm, index (farm.id)}
				{@const selected = selectedIds.has(farm.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="farms-table__row farms-table__row--clickable"
					class:farms-table__row--zebra={index % 2 === 0}
					class:farms-table__row--selected={selected}
					class:farms-table__row--hovered={hoveredFarmId === farm.id}
					onmouseenter={() => (hoveredFarmId = farm.id)}
					onmouseleave={() => (hoveredFarmId = null)}
					onclick={() => onRowClick(farm.id)}
				>
					<div class="farms-table__cell farms-table__cell--check">
						<button
							class="farms-checkbox"
							class:farms-checkbox--checked={selected}
							type="button"
							aria-label={`Select ${farm.farm_name}`}
							aria-checked={selected}
							role="checkbox"
							onclick={(event) => handleCheckboxClick(event, farm.id)}
						>
							{#if selected}
								<img src="/images/admin/checkboxCheckIcon.svg" alt="" />
							{/if}
						</button>
					</div>
					<div class="farms-table__cell">
						<span class="farms-table__text" title={farm.farm_name}>{farm.farm_name}</span>
					</div>
				</div>
			{/each}
		</div>

		<div class="farms-table__main">
			<div class="farms-table__row farms-table__row--header farms-table__row--wide">
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
				{@const selected = selectedIds.has(farm.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="farms-table__row farms-table__row--wide farms-table__row--clickable"
					class:farms-table__row--zebra={index % 2 === 0}
					class:farms-table__row--selected={selected}
					class:farms-table__row--hovered={hoveredFarmId === farm.id}
					onmouseenter={() => (hoveredFarmId = farm.id)}
					onmouseleave={() => (hoveredFarmId = null)}
					onclick={() => onRowClick(farm.id)}
				>
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
						<span class="farms-table__text farms-table__text--clamp" title={formatSeasonalProduce(farm)}
							>{formatSeasonalProduce(farm)}</span
						>
					</div>
					<div class="farms-table__cell">
						<span class="farms-table__text farms-table__text--clamp" title={formatAgritourism(farm)}
							>{formatAgritourism(farm)}</span
						>
					</div>
					<div class="farms-table__cell">
						<span class="farms-table__text farms-table__text--clamp" title={formatFarmersMarkets(farm)}
							>{formatFarmersMarkets(farm)}</span
						>
					</div>
					<div class="farms-table__cell">
						<span class="farms-table__text farms-table__text--clamp" title={formatExperience(farm)}
							>{formatExperience(farm)}</span
						>
					</div>
				</div>
			{/each}
		</div>

		{#if farms.length === 0}
			<div class="farms-table__empty">
				<p>{emptyMessage}</p>
			</div>
		{/if}
	</div>
</div>
