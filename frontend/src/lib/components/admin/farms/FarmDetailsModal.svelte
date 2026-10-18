<script lang="ts">
	import FarmModalShell from '$lib/components/admin/FarmModalShell.svelte';
	import FarmRequestContact from '$lib/components/admin/FarmRequestContact.svelte';
	import FarmRequestGallery from '$lib/components/admin/FarmRequestGallery.svelte';
	import FarmRequestSections from '$lib/components/admin/FarmRequestSections.svelte';
	import FarmDetailsModalSkeleton from '$lib/components/admin/farms/FarmDetailsModalSkeleton.svelte';
	import PreviousRejectionCard from '$lib/components/admin/PreviousRejectionCard.svelte';
	import { FARM_DETAILS_QUERY } from '$lib/utils/admin-farms';
	import { gqlClient } from '$lib/graphqlClient';
	import type { PendingFarmDto } from '$lib/types/admin';
	import { buildReviewSections, type ReviewSection } from '$lib/utils/farm-request-sections';
	import { formatFullDate } from '$lib/utils/relative-time';

	/** Sections shown in this modal's second column, alongside the photo gallery. */
	const ASIDE_SECTION_TITLES = new Set(['Farm Characteristics', 'Farm to School Sales']);

	function splitReviewSections(sections: ReviewSection[]): {
		details: ReviewSection[];
		aside: ReviewSection[];
	} {
		return {
			details: sections.filter((section) => !ASIDE_SECTION_TITLES.has(section.title)),
			aside: sections.filter((section) => ASIDE_SECTION_TITLES.has(section.title))
		};
	}

	interface Props {
		farmId: string;
		onClose: () => void;
		/** Called after the farm is archived so the parent can refresh its list. */
		onArchived?: (farmId: string) => void;
		/** The farm is archived: offer "Restore" instead of "Delete". */
		archived?: boolean;
		/** Called after an archived farm is restored so the parent can refresh its list. */
		onRestored?: (farmId: string) => void;
		/** Path to return to after editing the farm. */
		returnTo?: string;
		/** Where the farm is removed from when deleted, shown in the confirmation. */
		removalContext?: string;
	}

	let {
		farmId,
		onClose,
		onArchived,
		archived = false,
		onRestored,
		returnTo = '/admin/farms',
		removalContext = 'the farms list'
	}: Props = $props();

	let farm = $state<PendingFarmDto | null>(null);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	const sections = $derived(farm ? buildReviewSections(farm) : []);
	const { details: detailSections, aside: asideSections } = $derived(splitReviewSections(sections));
	const statusLabel = $derived.by(() => {
		if (!farm) return '';
		if (archived) return `Deleted ${formatFullDate(farm.updatedAt)}`;
		if (farm.status === 'REJECTED') return `Changes requested ${formatFullDate(farm.updatedAt)}`;
		return `Active since ${formatFullDate(farm.createdAt)}`;
	});
	const titleId = $derived(loading ? 'farm-details-modal-loading' : 'farm-details-modal-title');

	async function loadFarm() {
		loading = true;
		loadError = null;
		try {
			const data = await gqlClient<{ farmById: PendingFarmDto }>(FARM_DETAILS_QUERY, {
				id: farmId
			});
			farm = data.farmById;
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load farm.';
			farm = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void farmId;
		void loadFarm();
	});
</script>

<FarmModalShell
	{farmId}
	farmName={farm?.farm_name ?? ''}
	{titleId}
	{returnTo}
	{removalContext}
	menuDisabled={loading || Boolean(loadError)}
	busy={loading}
	{onClose}
	{onArchived}
	{archived}
	{onRestored}
>
	{#snippet children()}
		{#if loading}
			<h2 id="farm-details-modal-loading" class="sr-only">Loading farm details</h2>
			<FarmDetailsModalSkeleton />
		{:else if loadError || !farm}
			<p class="admin-empty-state">{loadError ?? 'Farm not found.'}</p>
		{:else}
			<div class="farm-request-modal__columns">
				<div class="farm-request-modal__details">
					<div class="farm-request-modal__meta">
						<span class="farm-request-modal__submitted">{statusLabel}</span>
					</div>

					<div class="farm-request-modal__title-row">
						<h2 id="farm-details-modal-title" class="farm-request-modal__title">
							{farm.farm_name}
						</h2>
						<span class="request-pill request-pill--mississippi-farm">Mississippi Farm</span>
					</div>

					{#if farm.status === 'REJECTED' || farm.was_previously_rejected}
						<PreviousRejectionCard
							farmId={farm.id}
							title={farm.status === 'REJECTED' ? 'Requested Changes' : 'Last Requested Changes'}
						/>
					{/if}

					<FarmRequestContact {farm} />
					<FarmRequestSections sections={detailSections} />
				</div>

				<aside class="farm-request-modal__aside">
					<FarmRequestGallery
						farmId={farm.id}
						farmName={farm.farm_name}
						coverPhoto={farm.cover_photo}
						carouselPhotos={farm.carousel_photos}
					/>
					{#each asideSections as section, index (section.title)}
						{#if index > 0}
							<hr class="farm-request-modal__divider" />
						{/if}
						<section class="farm-request-modal__section">
							<h3 class="farm-request-modal__section-title">{section.title}</h3>
							{#each section.fields as field, fieldIndex (`${section.title}-${fieldIndex}`)}
								<div class="farm-request-modal__field">
									{#if field.label}
										<p class="farm-request-modal__field-label">{field.label}</p>
									{/if}
									<p class="farm-request-modal__field-value">
										{#if field.kind === 'list'}
											{(field.values ?? []).join(', ')}
										{:else}
											{field.value}
										{/if}
									</p>
								</div>
							{/each}
						</section>
					{/each}
				</aside>
			</div>
		{/if}
	{/snippet}
</FarmModalShell>
