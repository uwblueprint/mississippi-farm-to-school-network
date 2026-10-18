<script lang="ts">
	import { onMount } from 'svelte';

	import AdminFarmCard from '$lib/components/admin/AdminFarmCard.svelte';
	import AdminSearchInput from '$lib/components/admin/AdminSearchInput.svelte';
	import RemovedFarmModal from '$lib/components/admin/RemovedFarmModal.svelte';
	import FarmDetailsModal from '$lib/components/admin/farms/FarmDetailsModal.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import SortDropdown from '$lib/components/SortDropdown.svelte';
	import {
		ADMIN_SORT_ITEMS,
		REMOVED_FARM_BADGE,
		REMOVED_FARM_FILTER_LABELS
	} from '$lib/constants/admin-request';
	import type { RemovedFarm, RemovedFarmFilter, RequestSort } from '$lib/types/admin';
	import { loadRemovedFarms, removedAt, removedFarmTimestamp } from '$lib/utils/removed-farms';

	let farms = $state<RemovedFarm[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	let search = $state('');
	let filter = $state<RemovedFarmFilter>('ALL');
	let sort = $state<RequestSort>('NEWEST');
	let selected = $state<RemovedFarm | null>(null);

	async function loadFarms() {
		loading = true;
		loadError = null;

		try {
			farms = await loadRemovedFarms();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load farms.';
			farms = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadFarms();
	});

	const counts = $derived({
		ALL: farms.length,
		ARCHIVED: farms.filter((f) => f.kind === 'ARCHIVED').length,
		DELETED: farms.filter((f) => f.kind === 'DELETED').length,
		CHANGES_REQUESTED: farms.filter((f) => f.kind === 'CHANGES_REQUESTED').length
	});

	const filterItems = $derived(
		(Object.keys(REMOVED_FARM_FILTER_LABELS) as RemovedFarmFilter[]).map((value) => ({
			value,
			label: REMOVED_FARM_FILTER_LABELS[value],
			count: counts[value]
		}))
	);

	function bySort(a: RemovedFarm, b: RemovedFarm): number {
		if (sort === 'NAME_ASC') return a.farm.farm_name.localeCompare(b.farm.farm_name);

		const diff = new Date(removedAt(b)).getTime() - new Date(removedAt(a)).getTime();
		return sort === 'OLDEST' ? -diff : diff;
	}

	const visibleFarms = $derived(
		farms
			.filter((item) => filter === 'ALL' || item.kind === filter)
			.filter((item) => item.farm.farm_name.toLowerCase().includes(search.trim().toLowerCase()))
			.toSorted(bySort)
	);

	const emptyMessage = $derived(
		farms.length === 0
			? 'No deleted, archived, or changes-requested farms.'
			: 'No farms match your search.'
	);
</script>

<svelte:head>
	<title>Deleted & Archived Farms | Admin</title>
</svelte:head>

<main class="admin-page">
	<div class="admin-page__inner">
		<header class="admin-page__header">
			<h1 class="admin-page__title">Deleted & Archived Farms</h1>
			<span class="admin-page__count">{counts.ALL}</span>
		</header>

		<div class="admin-toolbar">
			<div class="admin-toolbar__group">
				<AdminSearchInput
					bind:value={search}
					label="Search farm name"
					placeholder="Search farm name"
				/>
				<FilterPills items={filterItems} bind:selected={filter} ariaLabel="Filter farms" />
			</div>

			<SortDropdown items={ADMIN_SORT_ITEMS} bind:selected={sort} ariaLabel="Sort farms by" />
		</div>

		<div class="admin-request-list">
			{#if loading}
				<p class="admin-empty-state">Loading farms…</p>
			{:else if loadError}
				<p class="admin-empty-state">{loadError}</p>
			{:else}
				{#each visibleFarms as item (item.farm.id)}
					<AdminFarmCard
						farm={item.farm}
						badge={REMOVED_FARM_BADGE[item.kind]}
						timestamp={removedFarmTimestamp(item)}
						onSelect={() => (selected = item)}
					/>
				{:else}
					<p class="admin-empty-state">{emptyMessage}</p>
				{/each}
			{/if}
		</div>
	</div>
</main>

{#if selected?.kind === 'CHANGES_REQUESTED'}
	<!-- A rejected farm isn't removed, so it gets the regular admin details modal. -->
	<FarmDetailsModal
		farmId={selected.farm.id}
		returnTo="/admin/archived"
		removalContext="the changes-requested list"
		onClose={() => (selected = null)}
		onRemoved={() => void loadFarms()}
	/>
{:else if selected}
	<RemovedFarmModal
		item={selected}
		onClose={() => (selected = null)}
		onResolved={() => void loadFarms()}
	/>
{/if}
