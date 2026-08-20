<script lang="ts">
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmDetailPanel from '$lib/components/map/FarmDetailPanel.svelte';
	import FarmListItem from '$lib/components/map/FarmListItem.svelte';
	import FarmSearch from '$lib/components/map/FarmSearch.svelte';
	import SortDropdown from '$lib/components/SortDropdown.svelte';
	import FarmFilterBar from '$lib/components/map/FarmFilterBar.svelte';
	import { userLocation } from '$lib/state/geolocation.svelte';
	import { EMPTY_FARM_FILTERS, filterFarms, type FarmFilterState } from '$lib/utils/farm-filters';
	import type { MapFarm } from '$lib/types/farm';

	const MAP_SORT_ITEMS = [
		{ value: 'distance', label: 'Distance' },
		{ value: 'name-asc', label: 'Name (A–Z)' },
		{ value: 'name-desc', label: 'Name (Z–A)' }
	];

	interface Props {
		farms: MapFarm[];
		map: MapboxMap | null;
		selectedFarmId?: string | null;
		onSelectFarm?: (farm: MapFarm) => void;
		loading?: boolean;
		error?: string | null;
	}

	let {
		farms,
		map,
		selectedFarmId = $bindable(null),
		onSelectFarm,
		loading = false,
		error = null
	}: Props = $props();

	/** Local only for now — map sort is not wired to the list yet. */
	let sortBy = $state<string | null>(null);

	let filters = $state<FarmFilterState>({ ...EMPTY_FARM_FILTERS });

	// Everything below the filter row works off the filtered list, so the count,
	// the prev/next stepper and the map selection all agree on what is visible.
	const visibleFarms = $derived(filterFarms(farms, filters, userLocation.coords));

	const selectedFarm = $derived(visibleFarms.find((farm) => farm.id === selectedFarmId) ?? null);
	const selectedFarmIndex = $derived(
		selectedFarmId ? visibleFarms.findIndex((farm) => farm.id === selectedFarmId) : -1
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
			handleSelect(visibleFarms[selectedFarmIndex - 1]);
		}
	}

	function handleNext() {
		if (selectedFarmIndex >= 0 && selectedFarmIndex < visibleFarms.length - 1) {
			handleSelect(visibleFarms[selectedFarmIndex + 1]);
		}
	}
</script>

<aside class="farm-map-sidebar">
	{#if selectedFarm && selectedFarmIndex >= 0}
		<FarmDetailPanel
			farm={selectedFarm}
			farmIndex={selectedFarmIndex}
			farmCount={visibleFarms.length}
			onBack={handleBack}
			onPrevious={handlePrevious}
			onNext={handleNext}
		/>
	{:else}
		<div class="farm-map-sidebar__header">
			<FarmSearch {map} />

			<div class="farm-map-sidebar__title-row">
				<div class="farm-map-sidebar__title-group">
					<h1 class="farm-map-sidebar__title">Farms</h1>
					<span class="farm-map-sidebar__count">
						{loading ? 'Loading…' : `${visibleFarms.length} Results`}
					</span>
				</div>

				<SortDropdown
					items={MAP_SORT_ITEMS}
					bind:selected={sortBy}
					showSelectedLabel
					ariaLabel="Sort farms by"
				/>
			</div>

			<FarmFilterBar bind:filters />
		</div>

		<div class="farm-map-sidebar__list">
			{#if loading}
				<p class="farm-map-sidebar__status">Loading farms…</p>
			{:else if error}
				<p class="farm-map-sidebar__status farm-map-sidebar__status--error">{error}</p>
			{:else if visibleFarms.length === 0}
				<p class="farm-map-sidebar__status">
					{farms.length === 0 ? 'No approved farms to show yet.' : 'No farms match these filters.'}
				</p>
			{:else}
				{#each visibleFarms as farm (farm.id)}
					<FarmListItem {farm} selected={selectedFarmId === farm.id} onSelect={handleSelect} />
				{/each}
			{/if}
		</div>
	{/if}
</aside>
