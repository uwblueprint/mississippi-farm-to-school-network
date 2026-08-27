<script lang="ts">
	import FilterMenuPill from '$lib/components/map/FilterMenuPill.svelte';
	import { userLocation } from '$lib/state/geolocation.svelte';
	import {
		DISTANCE_OPTIONS,
		INSTITUTION_OPTIONS,
		PRODUCT_OPTIONS,
		TAG_OPTIONS,
		countActiveFilters,
		type FarmFilterState
	} from '$lib/utils/farm-filters';

	interface Props {
		/** Bound filter state; mutated in place so sibling pill bindings stay live. */
		filters: FarmFilterState;
	}

	let { filters = $bindable() }: Props = $props();

	// Distance is single-select, but the shared pill speaks in string arrays, so
	// it is adapted here rather than special-casing the component.
	let distanceSelection = $state<string[]>(
		filters.distance === null ? [] : [String(filters.distance)]
	);

	$effect(() => {
		const next = distanceSelection.length > 0 ? Number(distanceSelection[0]) : null;
		if (next !== filters.distance) {
			filters.distance = next;
		}
	});

	const locationKnown = $derived(userLocation.coords !== null);
	const activeCount = $derived(countActiveFilters(filters));

	function clearAll() {
		distanceSelection = [];
		filters.distance = null;
		filters.institutions = [];
		filters.products = [];
		filters.tags = [];
	}
</script>

<div class="farm-filters" aria-label="Farm filters">
	<span class="farm-filters__label">Filters</span>

	<div class="farm-filters__group">
		<FilterMenuPill
			label="Distance"
			options={DISTANCE_OPTIONS}
			bind:selected={distanceSelection}
			multiple={false}
			disabled={!locationKnown}
			hint={locationKnown ? undefined : 'Allow location access to filter by distance.'}
			ariaLabel="Filter by distance"
		/>

		<FilterMenuPill
			label="Institution Type"
			options={INSTITUTION_OPTIONS}
			bind:selected={filters.institutions}
			ariaLabel="Filter by institution type"
		/>

		<FilterMenuPill
			label="Products"
			options={PRODUCT_OPTIONS}
			bind:selected={filters.products}
			ariaLabel="Filter by products"
		/>

		<FilterMenuPill
			label="Tags"
			options={TAG_OPTIONS}
			bind:selected={filters.tags}
			ariaLabel="Filter by tags"
		/>

		{#if activeCount > 0}
			<button type="button" class="farm-filters__clear" onclick={clearAll}>Clear all</button>
		{/if}
	</div>
</div>

<style>
	.farm-filters {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.farm-filters__label {
		font-size: 1rem;
		color: #9ea0ad;
		white-space: nowrap;
	}

	.farm-filters__group {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.farm-filters__clear {
		border: none;
		background: none;
		padding: 0.25rem;
		font-family: inherit;
		font-size: 0.8125rem;
		color: #587244;
		cursor: pointer;
	}

	.farm-filters__clear:hover {
		text-decoration: underline;
	}
</style>
