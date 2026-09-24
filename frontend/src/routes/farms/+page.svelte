<script lang="ts">
	import { onMount } from 'svelte';
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmListSidebar from '$lib/components/map/FarmListSidebar.svelte';
	import FarmMap from '$lib/components/map/FarmMap.svelte';
	import { requestUserLocation } from '$lib/state/geolocation.svelte';
	import { farmDtoToMapFarm, type FarmDto } from '$lib/utils/farm-adapter';
	import { resolveFarmDisplayImages } from '$lib/utils/farm-images';
	import type { MapFarm } from '$lib/types/farm';
	import '$lib/styles/map/farm-map.css';

	let map = $state<MapboxMap | null>(null);
	let selectedFarmId = $state<string | null>(null);
	let farms = $state<MapFarm[]>([]);
	let visibleFarms = $state<MapFarm[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	async function loadFarms() {
		loading = true;
		loadError = null;

		try {
			const res = await fetch('/api/farms');
			const body = await res.json();

			if (!res.ok || !body.ok) {
				loadError = body.errors?.[0]?.message ?? 'Failed to load farms.';
				farms = [];
				return;
			}

			const mapped = ((body.farms ?? []) as FarmDto[]).map(farmDtoToMapFarm);
			farms = await Promise.all(
				mapped.map(async (farm) => {
					const images = await resolveFarmDisplayImages(farm);
					return { ...farm, ...images };
				})
			);
			visibleFarms = farms;
		} catch {
			loadError = 'Network error. Check your connection and try again.';
			farms = [];
			visibleFarms = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		requestUserLocation();
		void loadFarms();
	});
</script>

<svelte:head>
	<title>Farms | Mississippi Farm to School Network</title>
</svelte:head>

<div class="farm-map-page">
	<FarmListSidebar
		{farms}
		bind:selectedFarmId
		{map}
		{loading}
		error={loadError}
		onVisibleFarmsChange={(nextFarms) => (visibleFarms = nextFarms)}
	/>
	<div class="farm-map-panel">
		<FarmMap farms={visibleFarms} bind:selectedFarmId onMapReady={(instance) => (map = instance)} />
	</div>
</div>
