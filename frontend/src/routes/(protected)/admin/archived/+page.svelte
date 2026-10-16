<script lang="ts">
	import { onMount } from 'svelte';

	import AdminSearchInput from '$lib/components/admin/AdminSearchInput.svelte';
	import InactiveFarmCard from '$lib/components/admin/InactiveFarmCard.svelte';
	import FarmDetailsModal from '$lib/components/admin/farms/FarmDetailsModal.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import SortDropdown from '$lib/components/SortDropdown.svelte';
	import { ADMIN_SORT_ITEMS, INACTIVE_FILTER_LABELS } from '$lib/constants/admin-request';
	import { gqlClient } from '$lib/graphqlClient';
	import type {
		InactiveFarm,
		InactiveFarmFilter,
		PendingFarmDto,
		RequestSort
	} from '$lib/types/admin';
	import {
		ARCHIVED_FARMS_QUERY,
		CHANGES_REQUESTED_FARMS_QUERY,
		UNARCHIVE_FARM_MUTATION
	} from '$lib/utils/pending-request-adapter';

	// The backend caps `farms` at 100 per page, so page through until a short page.
	const PAGE_SIZE = 100;

	let items = $state<InactiveFarm[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	let search = $state('');
	let filter = $state<InactiveFarmFilter>('ALL');
	let sort = $state<RequestSort>('NEWEST');
	let selected = $state<InactiveFarm | null>(null);
	let restoringId = $state<string | null>(null);
	let restoreError = $state<string | null>(null);

	async function loadArchivedFarms(): Promise<PendingFarmDto[]> {
		const all: PendingFarmDto[] = [];
		for (let pageNumber = 1; ; pageNumber++) {
			const data = await gqlClient<{ farms: PendingFarmDto[] }>(ARCHIVED_FARMS_QUERY, {
				pageNumber,
				pageSize: PAGE_SIZE
			});
			all.push(...data.farms);
			if (data.farms.length < PAGE_SIZE) return all;
		}
	}

	async function loadItems() {
		loading = true;
		loadError = null;

		try {
			const [archived, changesRequested] = await Promise.all([
				loadArchivedFarms(),
				gqlClient<{ farmsByStatus: PendingFarmDto[] }>(CHANGES_REQUESTED_FARMS_QUERY)
			]);
			items = [
				...archived.map((farm): InactiveFarm => ({ kind: 'DELETED', farm })),
				...changesRequested.farmsByStatus.map(
					(farm): InactiveFarm => ({ kind: 'CHANGES_REQUESTED', farm })
				)
			];
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load farms.';
			items = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadItems();
	});

	const counts = $derived({
		ALL: items.length,
		DELETED: items.filter((item) => item.kind === 'DELETED').length,
		CHANGES_REQUESTED: items.filter((item) => item.kind === 'CHANGES_REQUESTED').length
	});

	const filterItems = $derived(
		(Object.keys(INACTIVE_FILTER_LABELS) as InactiveFarmFilter[]).map((value) => ({
			value,
			label: INACTIVE_FILTER_LABELS[value],
			count: counts[value]
		}))
	);

	function bySort(a: InactiveFarm, b: InactiveFarm): number {
		if (sort === 'NAME_ASC') return a.farm.farm_name.localeCompare(b.farm.farm_name);

		const diff = new Date(b.farm.updatedAt).getTime() - new Date(a.farm.updatedAt).getTime();
		return sort === 'OLDEST' ? -diff : diff;
	}

	const visibleItems = $derived(
		items
			.filter((item) => filter === 'ALL' || item.kind === filter)
			.filter((item) => item.farm.farm_name.toLowerCase().includes(search.trim().toLowerCase()))
			.toSorted(bySort)
	);

	function removeItem(farmId: string) {
		items = items.filter((item) => item.farm.id !== farmId);
	}

	async function restoreFarm(item: InactiveFarm) {
		if (restoringId) return;
		restoringId = item.farm.id;
		restoreError = null;
		try {
			await gqlClient(UNARCHIVE_FARM_MUTATION, { id: item.farm.id });
			removeItem(item.farm.id);
		} catch (error) {
			restoreError =
				error instanceof Error ? error.message : `Failed to restore ${item.farm.farm_name}.`;
		} finally {
			restoringId = null;
		}
	}
</script>

<svelte:head>
	<title>Deleted & Pending Farms | Admin</title>
</svelte:head>

<main class="admin-page">
	<div class="admin-page__inner">
		<header class="admin-page__header">
			<h1 class="admin-page__title">Deleted & Pending Farms</h1>
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

		{#if restoreError}
			<p class="admin-empty-state" role="alert">{restoreError}</p>
		{/if}

		<div class="admin-request-list">
			{#if loading}
				<p class="admin-empty-state">Loading farms…</p>
			{:else if loadError}
				<p class="admin-empty-state">{loadError}</p>
			{:else}
				{#each visibleItems as item (item.farm.id)}
					<InactiveFarmCard
						{item}
						onSelect={(next) => (selected = next)}
						onRestore={restoreFarm}
						restoring={restoringId === item.farm.id}
					/>
				{:else}
					<p class="admin-empty-state">
						{items.length === 0
							? 'No deleted farms or farms awaiting changes.'
							: 'No farms match your search.'}
					</p>
				{/each}
			{/if}
		</div>
	</div>
</main>

{#if selected}
	<FarmDetailsModal
		farmId={selected.farm.id}
		archived={selected.kind === 'DELETED'}
		returnTo="/admin/archived"
		removalContext="the changes-requested list"
		onClose={() => (selected = null)}
		onRestored={removeItem}
		onArchived={() => void loadItems()}
	/>
{/if}
