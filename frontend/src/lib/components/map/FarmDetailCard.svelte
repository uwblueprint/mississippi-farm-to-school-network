<script lang="ts">
	import { userLocation } from '$lib/state/geolocation.svelte';
	import type { MapFarm } from '$lib/types/farm';
	import { distanceInMiles, formatDistanceLabel } from '$lib/utils/distance';
	import { getFarmTags, getTagColor } from '$lib/utils/farm-tags';

	interface Props {
		farm: MapFarm;
	}

	let { farm }: Props = $props();

	const tags = $derived(getFarmTags(farm));
	const distanceLabel = $derived(
		userLocation.coords
			? formatDistanceLabel(distanceInMiles(userLocation.coords, farm.location))
			: null
	);
</script>

<article class="farm-map-popup" aria-label="{farm.farm_name} details">
	<div class="farm-map-popup__image-wrap">
		<img class="farm-map-popup__image" src={farm.thumbnailUrl} alt="" />
		{#if tags[0]}
			<span class="farm-map-popup__tag farm-tag farm-tag--{getTagColor(tags[0])}">{tags[0]}</span>
		{/if}
	</div>
	{#if distanceLabel}
		<p class="farm-map-popup__distance">{distanceLabel}</p>
	{/if}
	<h2 class="farm-map-popup__title">{farm.farm_name}</h2>
	<p class="farm-map-popup__address">{farm.farm_address}</p>
</article>
