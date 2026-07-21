<script lang="ts">
	import { onMount } from 'svelte';
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmListSidebar from '$lib/components/map/FarmListSidebar.svelte';
	import FarmMap from '$lib/components/map/FarmMap.svelte';
	import { MOCK_FARMS } from '$lib/data/mock-farms';
	import { requestUserLocation } from '$lib/state/geolocation.svelte';
	import '$lib/styles/map/farm-map.css';

	let map = $state<MapboxMap | null>(null);
	let selectedFarmId = $state<string | null>(null);

	onMount(() => {
		requestUserLocation();
	});
</script>

<svelte:head>
	<title>Farms | Mississippi Farm to School Network</title>
</svelte:head>

<div class="farm-map-page">
	<FarmListSidebar farms={MOCK_FARMS} bind:selectedFarmId {map} />
	<div class="farm-map-panel">
		<FarmMap farms={MOCK_FARMS} bind:selectedFarmId onMapReady={(instance) => (map = instance)} />
	</div>
</div>
