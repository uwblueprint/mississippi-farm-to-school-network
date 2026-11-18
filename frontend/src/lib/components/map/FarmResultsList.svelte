<script lang="ts">
	import FarmListItem from '$lib/components/map/FarmListItem.svelte';
	import type { MapFarm } from '$lib/types/farm';

	interface Props {
		farms: MapFarm[];
		totalCount: number;
		selectedFarmId: string | null;
		loading: boolean;
		error: string | null;
		onSelect: (farm: MapFarm) => void;
		onClearFilters: () => void;
	}

	let { farms, totalCount, selectedFarmId, loading, error, onSelect, onClearFilters }: Props =
		$props();
</script>

{#if loading}
	<p class="farm-map-sidebar__status">Loading farms…</p>
{:else if error}
	<p class="farm-map-sidebar__status farm-map-sidebar__status--error">{error}</p>
{:else if totalCount === 0}
	<p class="farm-map-sidebar__status">No approved farms to show yet.</p>
{:else if farms.length === 0}
	<div class="farm-map-sidebar__status">
		<p>No farms match these filters.</p>
		<button type="button" class="farm-map-sidebar__clear" onclick={onClearFilters}>
			Clear filters
		</button>
	</div>
{:else}
	{#each farms as farm (farm.id)}
		<FarmListItem {farm} selected={selectedFarmId === farm.id} {onSelect} />
	{/each}
{/if}
