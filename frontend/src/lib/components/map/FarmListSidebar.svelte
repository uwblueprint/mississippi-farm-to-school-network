<script lang="ts">
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmDetailPanel from '$lib/components/map/FarmDetailPanel.svelte';
	import FarmListItem from '$lib/components/map/FarmListItem.svelte';
	import FarmSearch from '$lib/components/map/FarmSearch.svelte';
	import FarmSortDropdown from '$lib/components/map/FarmSortDropdown.svelte';
	import FilterPills from '$lib/components/map/FilterPills.svelte';
	import type { MapFarm } from '$lib/types/farm';

	interface Props {
		farms: MapFarm[];
		map: MapboxMap | null;
		selectedFarmId?: string | null;
		onSelectFarm?: (farm: MapFarm) => void;
	}

	let { farms, map, selectedFarmId = $bindable(null), onSelectFarm }: Props = $props();

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
					<span class="farm-map-sidebar__count">{farms.length} Results</span>
				</div>

				<FarmSortDropdown />
			</div>

			<FilterPills />
		</div>

		<div class="farm-map-sidebar__list">
			{#each farms as farm (farm.id)}
				<FarmListItem {farm} selected={selectedFarmId === farm.id} onSelect={handleSelect} />
			{/each}
		</div>
	{/if}
</aside>
