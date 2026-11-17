<script lang="ts">
	import type { Map as MapboxMap } from 'mapbox-gl';

	import AnnouncementLauncher from '$lib/components/map/AnnouncementLauncher.svelte';
	import FarmDetailPanel from '$lib/components/map/FarmDetailPanel.svelte';
	import FarmResultsList from '$lib/components/map/FarmResultsList.svelte';
	import FarmSearch from '$lib/components/map/FarmSearch.svelte';
	import FilterMenu from '$lib/components/map/FilterMenu.svelte';
	import SortDropdown from '$lib/components/SortDropdown.svelte';
	import { userLocation } from '$lib/state/geolocation.svelte';
	import {
		DISTANCE_OPTIONS,
		EMPTY_FARM_FILTERS,
		INSTITUTION_TYPE_OPTIONS,
		PRODUCT_OPTIONS,
		SORT_OPTIONS,
		TAG_OPTIONS,
		getLocationNote,
		hasActiveFilters,
		type FarmFilters,
		type FarmSortKey
	} from '$lib/utils/farm-filters';
	import type { MapFarm } from '$lib/types/farm';

	interface Props {
		farms: MapFarm[];
		totalCount: number;
		filters: FarmFilters;
		sortBy: FarmSortKey | null;
		map: MapboxMap | null;
		selectedFarmId?: string | null;
		onSelectFarm?: (farm: MapFarm) => void;
		loading?: boolean;
		error?: string | null;
	}

	let {
		farms,
		totalCount,
		filters = $bindable(),
		sortBy = $bindable(),
		map,
		selectedFarmId = $bindable(null),
		onSelectFarm,
		loading = false,
		error = null
	}: Props = $props();

	const locationNote = $derived(getLocationNote(userLocation.status));

	const getDistanceSelection = () => (filters.maxDistance === null ? [] : [filters.maxDistance]);
	const setDistanceSelection = (next: number[]) => (filters.maxDistance = next[0] ?? null);

	const getSortBy = () => sortBy;
	const setSortBy = (next: string | null) => (sortBy = next as FarmSortKey | null);

	function clearFilters() {
		filters = { ...EMPTY_FARM_FILTERS };
	}

	const selectedFarm = $derived(farms.find((farm) => farm.id === selectedFarmId) ?? null);
	const selectedFarmIndex = $derived(
		selectedFarmId ? farms.findIndex((farm) => farm.id === selectedFarmId) : -1
	);

	function handleSelect(farm: MapFarm) {
		selectedFarmId = farm.id;
		onSelectFarm?.(farm);
	}

	function handleBack() {
		selectedFarmId = null;
	}

	function handlePrevious() {
		if (selectedFarmIndex > 0) {
			handleSelect(farms[selectedFarmIndex - 1]);
		}
	}

	function handleNext() {
		if (selectedFarmIndex >= 0 && selectedFarmIndex < farms.length - 1) {
			handleSelect(farms[selectedFarmIndex + 1]);
		}
	}
</script>

<aside class="farm-map-sidebar">
	{#if selectedFarm && selectedFarmIndex >= 0}
		<FarmDetailPanel
			farm={selectedFarm}
			farmIndex={selectedFarmIndex}
			farmCount={farms.length}
			onBack={handleBack}
			onPrevious={handlePrevious}
			onNext={handleNext}
		/>
	{:else}
		<div class="farm-map-sidebar__header">
			<div class="farm-map-sidebar__search-row">
				<AnnouncementLauncher />
				<FarmSearch {map} />
			</div>

			<div class="farm-map-sidebar__title-row">
				<div class="farm-map-sidebar__title-group">
					<a href="/" class="farm-map-sidebar__back" aria-label="Back to home">
						<span aria-hidden="true">‹</span>
					</a>
					<h1 class="farm-map-sidebar__title">Farms</h1>
					<span class="farm-map-sidebar__count">
						{loading ? 'Loading…' : `${farms.length} ${farms.length === 1 ? 'Result' : 'Results'}`}
					</span>
				</div>

				<SortDropdown
					items={SORT_OPTIONS}
					bind:selected={getSortBy, setSortBy}
					showSelectedLabel
					ariaLabel="Sort farms by"
				/>
			</div>

			<div class="farm-map-sidebar__filters" role="group" aria-label="Farm filters">
				<span class="farm-map-sidebar__filters-label">Filters</span>
				<FilterMenu
					label="Distance"
					options={DISTANCE_OPTIONS}
					multiple={false}
					note={locationNote}
					bind:selected={getDistanceSelection, setDistanceSelection}
				/>
				<FilterMenu
					label="Institution Type"
					options={INSTITUTION_TYPE_OPTIONS}
					bind:selected={filters.institutionTypes}
				/>
				<FilterMenu label="Products" options={PRODUCT_OPTIONS} bind:selected={filters.products} />
				<FilterMenu label="Tags" options={TAG_OPTIONS} bind:selected={filters.tags} />
				{#if hasActiveFilters(filters)}
					<button type="button" class="farm-map-sidebar__clear" onclick={clearFilters}>
						Clear all
					</button>
				{/if}
			</div>
			{#if sortBy === 'distance' && locationNote}
				<p class="farm-map-sidebar__hint">{locationNote} Sorting by name for now.</p>
			{/if}
		</div>

		<div class="farm-map-sidebar__list">
			<FarmResultsList
				{farms}
				{totalCount}
				{selectedFarmId}
				{loading}
				{error}
				onSelect={handleSelect}
				onClearFilters={clearFilters}
			/>
		</div>
	{/if}
</aside>
