<script lang="ts">
	import { onMount } from 'svelte';

	import AdminSearchInput from '$lib/components/admin/AdminSearchInput.svelte';
	import FarmDetailsModal from '$lib/components/admin/farms/FarmDetailsModal.svelte';
	import FarmsTable from '$lib/components/admin/farms/FarmsTable.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { showToast } from '$lib/state/toast.svelte';
	import {
		ADMIN_FARMS_PAGE_SIZE,
		ADMIN_FARMS_QUERY,
		EMPTY_FILTERS,
		farmMatchesFilters,
		farmMatchesSearch,
		sortFarms,
		visiblePageNumbers,
		type AdminFarmRow,
		type FarmColumnFilters,
		type SortState,
		type SortableColumn
	} from '$lib/utils/admin-farms';
	import { downloadFarmsCsv } from '$lib/utils/export-farms-csv';

	let farms = $state<AdminFarmRow[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	let search = $state('');
	let sort = $state<SortState>({ column: 'farm_name', direction: 'asc' });
	let filters = $state<FarmColumnFilters>({ ...EMPTY_FILTERS });
	let selectedIds = $state<Set<string>>(new Set());
	let page = $state(1);

	let showExportModal = $state(false);
	let selectedFarmId = $state<string | null>(null);

	async function loadFarms() {
		loading = true;
		loadError = null;
		try {
			const data = await gqlClient<{ farms: AdminFarmRow[] }>(ADMIN_FARMS_QUERY);
			farms = data.farms;
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

	const filteredFarms = $derived(
		sortFarms(
			farms.filter((farm) => farmMatchesSearch(farm, search) && farmMatchesFilters(farm, filters)),
			sort
		)
	);

	const totalPages = $derived(Math.max(1, Math.ceil(filteredFarms.length / ADMIN_FARMS_PAGE_SIZE)));

	const pageFarms = $derived(
		filteredFarms.slice((page - 1) * ADMIN_FARMS_PAGE_SIZE, page * ADMIN_FARMS_PAGE_SIZE)
	);

	const rangeLabel = $derived.by(() => {
		if (filteredFarms.length === 0) return '0 of 0';
		const start = (page - 1) * ADMIN_FARMS_PAGE_SIZE + 1;
		const end = Math.min(page * ADMIN_FARMS_PAGE_SIZE, filteredFarms.length);
		return `${start}-${end} of ${filteredFarms.length}`;
	});

	const pageNumbers = $derived(visiblePageNumbers(page, totalPages));

	const allFilteredSelected = $derived(
		filteredFarms.length > 0 && filteredFarms.every((f) => selectedIds.has(f.id))
	);
	const someFilteredSelected = $derived(filteredFarms.some((f) => selectedIds.has(f.id)));

	const exportCount = $derived(selectedIds.size > 0 ? selectedIds.size : filteredFarms.length);
	const exportingAll = $derived(selectedIds.size === 0);

	const emptyMessage = $derived(
		farms.length === 0 ? 'No active farms yet.' : 'No farms match the current filters.'
	);

	$effect(() => {
		// Reset to first page when search/filters change the result set.
		void search;
		void JSON.stringify(filters);
		page = 1;
	});

	$effect(() => {
		if (page > totalPages) page = totalPages;
	});

	function toggleSort(column: SortableColumn) {
		if (sort?.column === column) {
			sort = { column, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
		} else {
			sort = { column, direction: 'asc' };
		}
	}

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleSelectAll() {
		if (allFilteredSelected) {
			selectedIds = new Set();
			return;
		}
		selectedIds = new Set(filteredFarms.map((f) => f.id));
	}

	function openExportModal() {
		if (exportCount === 0) return;
		showExportModal = true;
	}

	function handleFarmArchived(farmId: string) {
		farms = farms.filter((f) => f.id !== farmId);
		const next = new Set(selectedIds);
		next.delete(farmId);
		selectedIds = next;
	}

	function confirmExport() {
		showExportModal = false;
		try {
			const toExport =
				selectedIds.size > 0 ? filteredFarms.filter((f) => selectedIds.has(f.id)) : filteredFarms;
			downloadFarmsCsv(toExport);
			showToast(
				'success',
				'Your farm data has been successfully exported as a CSV file.',
				'CSV Export Complete'
			);
		} catch {
			showToast(
				'error',
				'There was an issue exporting your CSV file. Please try again.',
				'CSV Export Failed'
			);
		}
	}
</script>

<svelte:head>
	<title>Farms | Admin</title>
</svelte:head>

<main class="admin-page">
	<div class="admin-page__inner">
		<header class="admin-page__header">
			<h1 class="admin-page__title">Farms</h1>
		</header>

		<div class="farms-toolbar">
			<div class="farms-toolbar__left">
				<AdminSearchInput bind:value={search} label="Search farms" placeholder="Search" />
				{#if selectedIds.size > 0}
					<p class="farms-toolbar__selected">{selectedIds.size} Selected</p>
				{/if}
			</div>

			<div class="farms-toolbar__actions">
				<button
					class="farms-btn farms-btn--outline"
					type="button"
					disabled={exportCount === 0 || loading}
					onclick={openExportModal}
				>
					<img src="/images/admin/uploadIcon.svg" alt="" />
					<span>Export</span>
				</button>
				<a class="farms-btn farms-btn--primary" href="/new-farm">
					<span>Add Farm</span>
					<img src="/images/admin/plusWhiteIcon.svg" alt="" />
				</a>
			</div>
		</div>

		{#if loading}
			<p class="admin-empty-state">Loading farms…</p>
		{:else if loadError}
			<p class="admin-empty-state">{loadError}</p>
		{:else}
			<FarmsTable
				farms={pageFarms}
				{selectedIds}
				{sort}
				{filters}
				{emptyMessage}
				onToggleSort={toggleSort}
				onToggleSelect={toggleSelect}
				onToggleSelectAll={toggleSelectAll}
				onFiltersChange={(next) => (filters = next)}
				onRowClick={(id) => (selectedFarmId = id)}
				allSelected={allFilteredSelected}
				someSelected={someFilteredSelected}
			/>

			<div class="farms-pagination">
				<p class="farms-pagination__range">{rangeLabel}</p>
				<div class="farms-pagination__controls">
					<div class="farms-pagination__arrows">
						<button
							type="button"
							class="farms-pagination__icon-btn"
							aria-label="First page"
							disabled={page <= 1}
							onclick={() => (page = 1)}
						>
							<img src="/images/common/chevronLeftDoubleIcon.svg" alt="" />
						</button>
						<button
							type="button"
							class="farms-pagination__icon-btn"
							aria-label="Previous page"
							disabled={page <= 1}
							onclick={() => (page = Math.max(1, page - 1))}
						>
							<img src="/images/common/chevronLeftNavIcon.svg" alt="" />
						</button>
					</div>

					<div class="farms-pagination__pages">
						{#each pageNumbers as n (n)}
							<button
								type="button"
								class="farms-pagination__page"
								class:farms-pagination__page--active={n === page}
								aria-current={n === page ? 'page' : undefined}
								onclick={() => (page = n)}
							>
								{n}
							</button>
						{/each}
					</div>

					<div class="farms-pagination__arrows">
						<button
							type="button"
							class="farms-pagination__icon-btn"
							aria-label="Next page"
							disabled={page >= totalPages}
							onclick={() => (page = Math.min(totalPages, page + 1))}
						>
							<img src="/images/common/chevronRightNavIcon.svg" alt="" />
						</button>
						<button
							type="button"
							class="farms-pagination__icon-btn"
							aria-label="Last page"
							disabled={page >= totalPages}
							onclick={() => (page = totalPages)}
						>
							<img src="/images/common/chevronRightDoubleIcon.svg" alt="" />
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</main>

{#if showExportModal}
	<ConfirmDialog
		title="Export to CSV"
		confirmLabel={`Export ${exportCount} ${exportCount === 1 ? 'Farm' : 'Farms'}`}
		body={exportBody}
		onconfirm={confirmExport}
		oncancel={() => (showExportModal = false)}
	/>
{/if}

{#if selectedFarmId}
	<FarmDetailsModal
		farmId={selectedFarmId}
		onClose={() => (selectedFarmId = null)}
		onArchived={handleFarmArchived}
	/>
{/if}

{#snippet exportBody()}
	{#if exportingAll}
		Export all <strong>{exportCount}</strong> farms as a CSV file. The exported file will include all
		visible table columns.
	{:else}
		Export the <strong>{exportCount}</strong> selected farms as a CSV file. The exported file will include
		all visible table columns.
	{/if}
{/snippet}
