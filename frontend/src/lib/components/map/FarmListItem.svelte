<script lang="ts">
	import { userLocation } from '$lib/state/geolocation.svelte';
	import type { MapFarm } from '$lib/types/farm';
	import { distanceInMiles, formatDistanceLabel } from '$lib/utils/distance';
	import { getFarmTags, getTagColor } from '$lib/utils/farm-tags';

	interface Props {
		farm: MapFarm;
		selected?: boolean;
		onSelect?: (farm: MapFarm) => void;
	}

	let { farm, selected = false, onSelect }: Props = $props();

	const tags = $derived(getFarmTags(farm));
	const distanceLabel = $derived(
		userLocation.coords
			? formatDistanceLabel(distanceInMiles(userLocation.coords, farm.location))
			: null
	);
</script>

<button
	type="button"
	class="farm-list-item"
	class:farm-list-item--selected={selected}
	onclick={() => onSelect?.(farm)}
>
	<img class="farm-list-item__thumb" src={farm.thumbnailUrl} alt="" />
	<div class="farm-list-item__content">
		{#if distanceLabel}
			<p class="farm-list-item__distance">{distanceLabel}</p>
		{/if}
		<h3 class="farm-list-item__name">{farm.farm_name}</h3>
		<p class="farm-list-item__address">{farm.farm_address}</p>
		<div class="farm-list-item__tags">
			{#each tags as tag (tag)}
				<span class="farm-tag farm-tag--{getTagColor(tag)}">{tag}</span>
			{/each}
		</div>
	</div>
</button>
