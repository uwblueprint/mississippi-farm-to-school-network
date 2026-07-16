<script lang="ts">
	import { mount, onMount, onDestroy, unmount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import type { Map as MapboxMap, MapboxGeoJSONFeature } from 'mapbox-gl';

	import FarmDetailCard from '$lib/components/map/FarmDetailCard.svelte';
	import MapLegend from '$lib/components/map/MapLegend.svelte';
	import { MARKER_META } from '$lib/constants/markers';
	import { farmsToGeoJSON } from '$lib/data/mock-farms';
	import type { MapFarm } from '$lib/types/farm';

	import 'mapbox-gl/dist/mapbox-gl.css';

	interface Props {
		farms: MapFarm[];
		selectedFarmId?: string | null;
		onSelectFarm?: (farm: MapFarm | null) => void;
		onMapReady?: (map: MapboxMap) => void;
	}

	let {
		farms,
		selectedFarmId = $bindable(null),
		onSelectFarm,
		onMapReady
	}: Props = $props();

	let mapContainer = $state<HTMLDivElement | null>(null);
	let map = $state<MapboxMap | null>(null);
	let missingToken = $state(false);

	let farmPopup: mapboxgl.Popup | null = null;
	let farmPopupMount: ReturnType<typeof mount> | null = null;
	let farmPopupFarmId: string | null = null;

	const POPUP_OFFSET = 18;

	function clearFarmPopup() {
		if (farmPopupMount) {
			unmount(farmPopupMount);
			farmPopupMount = null;
		}
		farmPopup?.remove();
		farmPopup = null;
		farmPopupFarmId = null;
	}

	function showFarmPopup(activeMap: MapboxMap, farm: MapFarm) {
		const lngLat: [number, number] = [farm.location.lng, farm.location.lat];

		if (farmPopup && farmPopupFarmId === farm.id) {
			farmPopup.setLngLat(lngLat);
			return;
		}

		clearFarmPopup();

		const container = document.createElement('div');
		farmPopupMount = mount(FarmDetailCard, {
			target: container,
			props: {
				farm
			}
		});

		farmPopup = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: false,
			closeOnMove: false,
			offset: POPUP_OFFSET,
			anchor: 'bottom',
			maxWidth: 'none',
			className: 'farm-map-popup-container'
		})
			.setLngLat(lngLat)
			.setDOMContent(container)
			.addTo(activeMap);

		farmPopupFarmId = farm.id;
	}

	function findFarmById(id: string | undefined): MapFarm | undefined {
		if (!id) return undefined;
		return farms.find((farm) => farm.id === id);
	}

	function addFarmLayers(activeMap: MapboxMap) {
		activeMap.addSource('farms', {
			type: 'geojson',
			data: farmsToGeoJSON(farms),
			cluster: true,
			clusterMaxZoom: 12,
			clusterRadius: 50
		});

		activeMap.addLayer({
			id: 'clusters',
			type: 'circle',
			source: 'farms',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': MARKER_META.farm.color,
				'circle-radius': ['step', ['get', 'point_count'], 18, 5, 22, 15, 28],
				'circle-stroke-width': 2,
				'circle-stroke-color': '#ffffff'
			}
		});

		activeMap.addLayer({
			id: 'cluster-count',
			type: 'symbol',
			source: 'farms',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': ['get', 'point_count_abbreviated'],
				'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
				'text-size': 13
			},
			paint: {
				'text-color': '#ffffff'
			}
		});

		activeMap.addLayer({
			id: 'unclustered-point',
			type: 'circle',
			source: 'farms',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': [
					'match',
					['get', 'markerType'],
					'farm',
					MARKER_META.farm.color,
					'market',
					MARKER_META.market.color,
					'processing',
					MARKER_META.processing.color,
					'csa',
					MARKER_META.csa.color,
					'pickup',
					MARKER_META.pickup.color,
					MARKER_META.farm.color
				],
				'circle-radius': 10,
				'circle-stroke-width': 2,
				'circle-stroke-color': '#ffffff'
			}
		});
	}

	function wireMapEvents(activeMap: MapboxMap) {
		activeMap.on('click', 'clusters', (event) => {
			const feature = event.features?.[0] as MapboxGeoJSONFeature | undefined;
			if (!feature || feature.geometry.type !== 'Point') return;

			const clusterId = feature.properties?.cluster_id;
			const source = activeMap.getSource('farms');
			if (clusterId === undefined || !source || source.type !== 'geojson') return;

			source.getClusterExpansionZoom(clusterId, (error, zoom) => {
				if (error || zoom === null || zoom === undefined) return;
				const coordinates = (feature.geometry as GeoJSON.Point).coordinates;
				activeMap.easeTo({ center: [coordinates[0], coordinates[1]], zoom });
			});
		});

		activeMap.on('click', 'unclustered-point', (event) => {
			const feature = event.features?.[0] as MapboxGeoJSONFeature | undefined;
			const farmId = feature?.properties?.id as string | undefined;
			const farm = findFarmById(farmId);
			if (!farm) return;

			selectedFarmId = farm.id;
			onSelectFarm?.(farm);
		});

		activeMap.on('mouseenter', 'clusters', () => {
			activeMap.getCanvas().style.cursor = 'pointer';
		});
		activeMap.on('mouseleave', 'clusters', () => {
			activeMap.getCanvas().style.cursor = '';
		});
		activeMap.on('mouseenter', 'unclustered-point', () => {
			activeMap.getCanvas().style.cursor = 'pointer';
		});
		activeMap.on('mouseleave', 'unclustered-point', () => {
			activeMap.getCanvas().style.cursor = '';
		});
	}

	onMount(() => {
		const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
		if (!token) {
			missingToken = true;
			return;
		}

		if (!mapContainer) return;

		mapboxgl.accessToken = token;
		const instance = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [-89.5, 32.8],
			zoom: 6.5
		});

		instance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

		instance.on('load', () => {
			addFarmLayers(instance);
			wireMapEvents(instance);
		});

		map = instance;
		onMapReady?.(instance);
	});

	$effect(() => {
		if (!map || !selectedFarmId) {
			clearFarmPopup();
			return;
		}

		const farm = findFarmById(selectedFarmId);
		if (!farm) {
			clearFarmPopup();
			return;
		}

		map.flyTo({
			center: [farm.location.lng, farm.location.lat],
			zoom: Math.max(map.getZoom(), 11),
			essential: true
		});

		showFarmPopup(map, farm);
	});

	onDestroy(() => {
		clearFarmPopup();
		map?.remove();
		map = null;
	});
</script>

{#if missingToken}
	<div class="farm-map-error">
		<p>
			Map unavailable.
		</p>
	</div>
{:else}
	<div class="farm-map-canvas" bind:this={mapContainer}></div>
	<MapLegend />
{/if}
