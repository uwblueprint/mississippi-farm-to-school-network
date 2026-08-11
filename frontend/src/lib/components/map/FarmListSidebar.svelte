<script lang="ts">
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmDetailPanel from '$lib/components/map/FarmDetailPanel.svelte';
	import FarmListItem from '$lib/components/map/FarmListItem.svelte';
	import FarmSearch from '$lib/components/map/FarmSearch.svelte';
	import SortDropdown from '$lib/components/SortDropdown.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import type { MapFarm } from '$lib/types/farm';

	const MAP_FILTER_ITEMS = ['Distance', 'Institution Type', 'Products', 'Tags'].map((label) => ({
		value: label,
		label
	}));

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
			<FarmSearch {map} />

			<div class="farm-map-sidebar__title-row">
				<div class="farm-map-sidebar__title-group">
					<h1 class="farm-map-sidebar__title">Farms</h1>
					<span class="farm-map-sidebar__count">
						{loading ? 'Loading…' : `${farms.length} Results`}
					</span>
				</div>

				<SortDropdown
					items={MAP_SORT_ITEMS}
					bind:selected={sortBy}
					showSelectedLabel
					ariaLabel="Sort farms by"
				/>
			</div>

			<FilterPills
				items={MAP_FILTER_ITEMS}
				selectable={false}
				showChevron
				groupLabel="Filters"
				ariaLabel="Farm filters"
			/>
		</div>

		<div class="farm-map-sidebar__list">
			{#if loading}
				<p class="farm-map-sidebar__status">Loading farms…</p>
			{:else if error}
				<p class="farm-map-sidebar__status farm-map-sidebar__status--error">{error}</p>
			{:else if farms.length === 0}
				<p class="farm-map-sidebar__status">No approved farms to show yet.</p>
			{:else}
				{#each farms as farm (farm.id)}
					<FarmListItem {farm} selected={selectedFarmId === farm.id} onSelect={handleSelect} />
				{/each}
			{/if}
		</div>
	{/if}
</aside>
