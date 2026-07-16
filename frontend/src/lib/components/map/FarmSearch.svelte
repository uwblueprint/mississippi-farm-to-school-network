<script lang="ts">
	import { onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
	import type { Map as MapboxMap } from 'mapbox-gl';

	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

	interface Props {
		map: MapboxMap | null;
	}

	let { map }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let geocoder: MapboxGeocoder | null = null;

	$effect(() => {
		if (!map || !container) return;

		const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
		if (!token) return;

		geocoder?.onRemove();
		geocoder = new MapboxGeocoder({
			accessToken: token,
			mapboxgl,
			marker: false,
			countries: 'us',
			bbox: [-91.7, 30.1, -88.4, 35.0],
			placeholder: 'Search Location'
		});

		container.appendChild(geocoder.onAdd(map));

		return () => {
			geocoder?.onRemove();
			geocoder = null;
		};
	});

	onDestroy(() => {
		geocoder?.onRemove();
		geocoder = null;
	});
</script>

<div class="farm-search" bind:this={container}></div>
