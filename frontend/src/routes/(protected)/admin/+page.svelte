<script lang="ts">
	import { onMount } from 'svelte';

	import AdminSearchInput from '$lib/components/admin/AdminSearchInput.svelte';
	import FarmRequestModal from '$lib/components/admin/FarmRequestModal.svelte';
	import PendingRequestCard from '$lib/components/admin/PendingRequestCard.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import SortDropdown from '$lib/components/SortDropdown.svelte';
	import { ADMIN_FILTER_LABELS, ADMIN_SORT_ITEMS } from '$lib/constants/admin-request';
	import { gqlClient } from '$lib/graphqlClient';
	import type {
		PendingFarmDto,
		PendingRequest,
		RequestFilter,
		RequestSort
	} from '$lib/types/admin';
	import { PENDING_FARMS_QUERY, pendingFarmToRequest } from '$lib/utils/pending-request-adapter';

	let requests = $state<PendingRequest[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	let search = $state('');
	let filter = $state<RequestFilter>('ALL');
	let sort = $state<RequestSort>('NEWEST');
	let selectedRequest = $state<PendingRequest | null>(null);

	async function loadRequests() {
		loading = true;
		loadError = null;

		try {
			const data = await gqlClient<{ farmsByStatus: PendingFarmDto[] }>(PENDING_FARMS_QUERY);
			requests = data.farmsByStatus.map(pendingFarmToRequest);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load pending requests.';
			requests = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadRequests();
	});

	const counts = $derived({
		ALL: requests.length,
		NEW_APPLICATION: requests.filter((r) => r.requestType === 'NEW_APPLICATION').length,
		UPDATED_APPLICATION: requests.filter((r) => r.requestType === 'UPDATED_APPLICATION').length
	});

	const filterItems = $derived(
		(Object.keys(ADMIN_FILTER_LABELS) as Array<keyof typeof ADMIN_FILTER_LABELS>).map((value) => ({
			value,
			label: ADMIN_FILTER_LABELS[value],
			count: counts[value]
		}))
	);

	function bySort(a: PendingRequest, b: PendingRequest): number {
		if (sort === 'NAME_ASC') return a.farm.farm_name.localeCompare(b.farm.farm_name);

		const diff = new Date(b.farm.updatedAt).getTime() - new Date(a.farm.updatedAt).getTime();
		return sort === 'OLDEST' ? -diff : diff;
	}

	const visibleRequests = $derived(
		requests
			.filter((request) => filter === 'ALL' || request.requestType === filter)
			.filter((request) =>
				request.farm.farm_name.toLowerCase().includes(search.trim().toLowerCase())
			)
			.toSorted(bySort)
	);

	function closeModal() {
		selectedRequest = null;
	}
</script>

<svelte:head>
	<title>Pending Requests | Admin</title>
</svelte:head>

<main class="admin-page">
	<div class="admin-page__inner">
		<header class="admin-page__header">
			<h1 class="admin-page__title">Pending Requests</h1>
			<span class="admin-page__count">{counts.ALL}</span>
		</header>

		<div class="admin-toolbar">
			<div class="admin-toolbar__group">
				<AdminSearchInput
					bind:value={search}
					label="Search farm name"
					placeholder="Search farm name"
				/>
				<FilterPills items={filterItems} bind:selected={filter} ariaLabel="Filter requests" />
			</div>

			<SortDropdown items={ADMIN_SORT_ITEMS} bind:selected={sort} ariaLabel="Sort requests by" />
		</div>

		<div class="admin-request-list">
			{#if loading}
				<p class="admin-empty-state">Loading pending requests…</p>
			{:else if loadError}
				<p class="admin-empty-state">{loadError}</p>
			{:else}
				{#each visibleRequests as request (request.farm.id)}
					<PendingRequestCard {request} onSelect={(selected) => (selectedRequest = selected)} />
				{:else}
					<p class="admin-empty-state">No pending requests match your search.</p>
				{/each}
			{/if}
		</div>
	</div>
</main>

{#if selectedRequest}
	<FarmRequestModal
		request={selectedRequest}
		onClose={closeModal}
		onResolved={() => void loadRequests()}
	/>
{/if}
