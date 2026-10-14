<script lang="ts">
	import FarmModalShell from '$lib/components/admin/FarmModalShell.svelte';
	import FarmRequestContact from '$lib/components/admin/FarmRequestContact.svelte';
	import FarmRequestGallery from '$lib/components/admin/FarmRequestGallery.svelte';
	import FarmRequestSections from '$lib/components/admin/FarmRequestSections.svelte';
	import FarmDetailsModalSkeleton from '$lib/components/admin/farms/FarmDetailsModalSkeleton.svelte';
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
	}

	let { farmId, onClose, onArchived }: Props = $props();

	let farm = $state<PendingFarmDto | null>(null);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	const sections = $derived(farm ? buildReviewSections(farm) : []);
	const { details: detailSections, aside: asideSections } = $derived(splitReviewSections(sections));
	const activeSinceLabel = $derived(farm ? `Active since ${formatFullDate(farm.createdAt)}` : '');
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
	returnTo="/admin/farms"
	removalContext="the farms list"
	menuDisabled={loading || Boolean(loadError)}
	busy={loading}
	{onClose}
	{onArchived}
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
						<span class="farm-request-modal__submitted">{activeSinceLabel}</span>
					</div>

					<div class="farm-request-modal__title-row">
						<h2 id="farm-details-modal-title" class="farm-request-modal__title">
							{farm.farm_name}
						</h2>
						<span class="request-pill request-pill--mississippi-farm">Mississippi Farm</span>
					</div>

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
