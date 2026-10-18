<script lang="ts">
	import { onMount } from 'svelte';
	import type { Map as MapboxMap } from 'mapbox-gl';

	import FarmListSidebar from '$lib/components/map/FarmListSidebar.svelte';
	import FarmMap from '$lib/components/map/FarmMap.svelte';
	import AnnouncementBar from '$lib/components/map/AnnouncementBar.svelte';
	import { setAnnouncements } from '$lib/state/announcementBar.svelte';
	import { requestUserLocation, userLocation } from '$lib/state/geolocation.svelte';
	import { farmDtoToMapFarm, type FarmDto } from '$lib/utils/farm-adapter';
	import {
		EMPTY_FARM_FILTERS,
		filterFarms,
		sortFarms,
		type FarmFilters,
		type FarmSortKey
	} from '$lib/utils/farm-filters';
	import { resolveFarmDisplayImages } from '$lib/utils/farm-images';
	import type { MapFarm } from '$lib/types/farm';
	import '$lib/styles/map/farm-map.css';

	let map = $state<MapboxMap | null>(null);
	let selectedFarmId = $state<string | null>(null);
	let farms = $state<MapFarm[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let filters = $state<FarmFilters>({ ...EMPTY_FARM_FILTERS });
	let sortBy = $state<FarmSortKey | null>(null);

	// Filter first, then sort; both the list and the map show this subset.
	const visibleFarms = $derived(
		sortFarms(filterFarms(farms, filters, userLocation.coords), sortBy, userLocation.coords)
	);

	async function loadAnnouncements() {
		try {
			const res = await fetch('/api/announcements/live');
			const body = await res.json();
			if (res.ok && body.ok) setAnnouncements(body.announcements);
		} catch {
			// the banner is non-essential; the map still works without it
		}
	}

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
		} catch {
			loadError = 'Network error. Check your connection and try again.';
			farms = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		requestUserLocation();
		void loadFarms();
		void loadAnnouncements();
	});
</script>

<svelte:head>
	<title>Farms | Mississippi Farm to School Network</title>
</svelte:head>

<div class="farm-map-shell">
	<AnnouncementBar onLayoutChange={() => map?.resize()} />
	<div class="farm-map-page">
		<FarmListSidebar
			farms={visibleFarms}
			totalCount={farms.length}
			bind:filters
			bind:sortBy
			bind:selectedFarmId
			{map}
			{loading}
			error={loadError}
		/>
		<div class="farm-map-panel">
			<FarmMap
				farms={visibleFarms}
				bind:selectedFarmId
				onMapReady={(instance) => (map = instance)}
			/>
		</div>
	</div>
</div>
