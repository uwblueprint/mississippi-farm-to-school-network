<script lang="ts">
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmDetailPanel from '$lib/components/map/FarmDetailPanel.svelte';
	import FarmMap from '$lib/components/map/FarmMap.svelte';
	import FarmResultsList from '$lib/components/map/FarmResultsList.svelte';
	import FarmSearch from '$lib/components/map/FarmSearch.svelte';
	import FilterMenu from '$lib/components/map/FilterMenu.svelte';
	import MobileBottomSheet, { type SheetSnap } from '$lib/components/map/MobileBottomSheet.svelte';
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
		selectedFarmId?: string | null;
		loading?: boolean;
		error?: string | null;
	}

	let {
		farms,
		totalCount,
		filters = $bindable(),
		sortBy = $bindable(),
		selectedFarmId = $bindable(null),
		loading = false,
		error = null
	}: Props = $props();

	let map = $state<MapboxMap | null>(null);
	let snap = $state<SheetSnap>('half');
	let sheetHeight = $state(0);
	let topBarHeight = $state(0);

	const locationNote = $derived(getLocationNote(userLocation.status));

	const getDistanceSelection = () => (filters.maxDistance === null ? [] : [filters.maxDistance]);
	const setDistanceSelection = (next: number[]) => (filters.maxDistance = next[0] ?? null);

	const getSortSelection = () => (sortBy === null ? [] : [sortBy]);
	const setSortSelection = (next: FarmSortKey[]) => (sortBy = next[0] ?? null);

	const sortLabel = $derived(SORT_OPTIONS.find((option) => option.value === sortBy)?.label);

	const selectedFarm = $derived(farms.find((farm) => farm.id === selectedFarmId) ?? null);
	const selectedFarmIndex = $derived(
		selectedFarmId ? farms.findIndex((farm) => farm.id === selectedFarmId) : -1
	);

	function clearFilters() {
		filters = { ...EMPTY_FARM_FILTERS };
	}

	/** Pin or list tap: half shows the farm card and still leaves its pin in view. */
	function showFarm(farm: MapFarm | null) {
		if (!farm) return;
		selectedFarmId = farm.id;
		snap = 'half';
	}

	function handlePrevious() {
		if (selectedFarmIndex > 0) selectedFarmId = farms[selectedFarmIndex - 1].id;
	}

	function handleNext() {
		if (selectedFarmIndex >= 0 && selectedFarmIndex < farms.length - 1) {
			selectedFarmId = farms[selectedFarmIndex + 1].id;
		}
	}
</script>

<div
	class="farm-map-mobile"
	class:farm-map-mobile--sheet-full={snap === 'full'}
	style:--sheet-height="{sheetHeight}px"
	style:--top-bar-height="{topBarHeight}px"
>
	<div class="farm-map-mobile__map">
		<FarmMap
			{farms}
			bind:selectedFarmId
			selectionStyle="highlight"
			bottomInset={sheetHeight}
			onSelectFarm={showFarm}
			onMapReady={(instance) => (map = instance)}
		/>
	</div>

	<header class="farm-map-mobile__top" bind:offsetHeight={topBarHeight}>
		<div class="farm-map-mobile__search-card">
			<a href="/" class="farm-map-mobile__back" aria-label="Back to home">
				<span aria-hidden="true">‹</span>
			</a>
			<div class="farm-map-mobile__search">
				<FarmSearch {map} />
			</div>
		</div>

		<div class="farm-map-mobile__chips" role="group" aria-label="Farm filters and sort">
			<FilterMenu
				variant="sheet"
				label="Distance"
				options={DISTANCE_OPTIONS}
				multiple={false}
				note={locationNote}
				bind:selected={getDistanceSelection, setDistanceSelection}
			/>
			<FilterMenu
				variant="sheet"
				label="Institution Type"
				options={INSTITUTION_TYPE_OPTIONS}
				bind:selected={filters.institutionTypes}
			/>
			<FilterMenu
				variant="sheet"
				label="Products"
				options={PRODUCT_OPTIONS}
				bind:selected={filters.products}
			/>
			<FilterMenu variant="sheet" label="Tags" options={TAG_OPTIONS} bind:selected={filters.tags} />
			<FilterMenu
				variant="sheet"
				label={sortLabel ? `Sort: ${sortLabel}` : 'Sort'}
				title="Sort by"
				showBadge={false}
				options={SORT_OPTIONS}
				multiple={false}
				note={sortBy === 'distance' ? locationNote : undefined}
				bind:selected={getSortSelection, setSortSelection}
			/>
			{#if hasActiveFilters(filters)}
				<button type="button" class="farm-map-mobile__clear-chip" onclick={clearFilters}>
					Clear all
				</button>
			{/if}
		</div>
	</header>

	<MobileBottomSheet
		bind:snap
		bind:visibleHeight={sheetHeight}
		topReserve={topBarHeight}
		label="Farm results"
	>
		{#snippet header()}
			<p class="farm-map-mobile__count">
				{loading ? 'Loading…' : `${farms.length} ${farms.length === 1 ? 'Result' : 'Results'}`}
			</p>
		{/snippet}

		{#if selectedFarm && selectedFarmIndex >= 0}
			<FarmDetailPanel
				farm={selectedFarm}
				farmIndex={selectedFarmIndex}
				farmCount={farms.length}
				onBack={() => (selectedFarmId = null)}
				onPrevious={handlePrevious}
				onNext={handleNext}
			/>
		{:else}
			<div class="farm-map-mobile__list">
				{#if sortBy === 'distance' && locationNote}
					<p class="farm-map-mobile__hint">{locationNote} Sorting by name for now.</p>
				{/if}
				<FarmResultsList
					{farms}
					{totalCount}
					{selectedFarmId}
					{loading}
					{error}
					onSelect={showFarm}
					onClearFilters={clearFilters}
				/>
			</div>
		{/if}
	</MobileBottomSheet>
</div>
