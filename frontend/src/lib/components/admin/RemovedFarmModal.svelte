<script lang="ts">
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FarmModalShell from '$lib/components/admin/FarmModalShell.svelte';
	import FarmRequestContact from '$lib/components/admin/FarmRequestContact.svelte';
	import FarmRequestGallery from '$lib/components/admin/FarmRequestGallery.svelte';
	import FarmRequestSections from '$lib/components/admin/FarmRequestSections.svelte';
	import { MAP_TAG_MODIFIER, REMOVED_FARM_BADGE } from '$lib/constants/admin-request';
	import { gqlClient } from '$lib/graphqlClient';
	import type { RemovedFarm } from '$lib/types/admin';
	import { buildReviewSections } from '$lib/utils/farm-request-sections';
	import { pendingFarmMapTag } from '$lib/utils/pending-request-adapter';
	import {
		PERMANENTLY_DELETE_FARM_MUTATION,
		RESTORE_FARM_MUTATION,
		UNARCHIVE_FARM_MUTATION,
		removedAt,
		removedFarmTimestamp
	} from '$lib/utils/removed-farms';

	interface Props {
		item: RemovedFarm;
		onClose: () => void;
		/** Called after a successful restore or permanent delete so the parent can refresh. */
		onResolved?: () => void;
	}

	let { item, onClose, onResolved }: Props = $props();

	let pendingAction = $state<'restore' | 'delete' | null>(null);
	let confirmDeleteOpen = $state(false);
	let actionError = $state<string | null>(null);

	const farm = $derived(item.farm);
	const isDeleted = $derived(item.kind === 'DELETED');
	const badge = $derived(REMOVED_FARM_BADGE[item.kind]);
	const sections = $derived(buildReviewSections(farm));
	const mapTag = $derived(pendingFarmMapTag(farm));
	const removedDate = $derived(
		new Date(removedAt(item)).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})
	);
	const busy = $derived(pendingAction !== null);

	async function runAction(action: 'restore' | 'delete', mutation: string, fallback: string) {
		if (busy) return;
		pendingAction = action;
		actionError = null;

		try {
			await gqlClient(mutation, { id: farm.id });
			confirmDeleteOpen = false;
			onResolved?.();
			onClose();
		} catch (error) {
			confirmDeleteOpen = false;
			actionError = error instanceof Error ? error.message : fallback;
		} finally {
			pendingAction = null;
		}
	}

	function handleRestore() {
		void runAction(
			'restore',
			isDeleted ? RESTORE_FARM_MUTATION : UNARCHIVE_FARM_MUTATION,
			'Failed to restore farm.'
		);
	}

	function handleConfirmDelete() {
		void runAction('delete', PERMANENTLY_DELETE_FARM_MUTATION, 'Failed to delete farm.');
	}
</script>

<FarmModalShell
	farmId={farm.id}
	farmName={farm.farm_name}
	titleId="removed-farm-modal-title"
	returnTo="/admin/archived"
	removalContext="the deleted & archived list"
	showMenu={false}
	closeDisabled={busy}
	blockClose={busy || confirmDeleteOpen}
	{onClose}
>
	{#snippet children()}
		<div class="farm-request-modal__columns">
			<div class="farm-request-modal__details">
				<div class="farm-request-modal__meta">
					<span class="request-pill request-pill--{badge.modifier}">{badge.label}</span>
					<span class="request-card__dot"></span>
					<span class="farm-request-modal__submitted">{removedFarmTimestamp(item)}</span>
				</div>

				<div class="farm-request-modal__title-row">
					<h2 id="removed-farm-modal-title" class="farm-request-modal__title">
						{farm.farm_name}
					</h2>
					{#if mapTag}
						<span class="request-pill request-pill--{MAP_TAG_MODIFIER[mapTag]}">
							{mapTag}
						</span>
					{/if}
				</div>

				<FarmRequestContact {farm} />
				<FarmRequestSections {sections} />
			</div>

			<aside class="farm-request-modal__aside">
				<FarmRequestGallery
					farmId={farm.id}
					farmName={farm.farm_name}
					coverPhoto={farm.cover_photo}
					carouselPhotos={farm.carousel_photos}
				/>

				<div class="review-application-card">
					<div class="review-application-card__copy">
						<h3 class="review-application-card__title">{badge.label}</h3>
						{#if isDeleted}
							<p class="review-application-card__body">Deleted on {removedDate}.</p>
							<p class="review-application-card__section-label">Reason for Deletion</p>
							<p class="review-application-card__body">
								{farm.deletion_reason ?? 'No reason provided.'}
							</p>
						{:else}
							<p class="review-application-card__body">
								This farm is archived and hidden from the map.
							</p>
						{/if}
						<p class="review-application-card__body">
							Choose <strong>Restore</strong> to bring the farm back where it was, or
							<strong>Delete Permanently</strong> to remove it for good.
						</p>
						{#if actionError}
							<p class="review-application-card__error">{actionError}</p>
						{/if}
					</div>

					<div class="review-application-card__actions">
						<button
							type="button"
							class="review-application-card__danger"
							disabled={busy}
							onclick={() => (confirmDeleteOpen = true)}
						>
							Delete Permanently
						</button>
						<button
							type="button"
							class="review-application-card__approve"
							disabled={busy}
							onclick={handleRestore}
						>
							{pendingAction === 'restore' ? 'Restoring…' : 'Restore'}
						</button>
					</div>
				</div>
			</aside>
		</div>
	{/snippet}
</FarmModalShell>

{#if confirmDeleteOpen}
	<ConfirmDialog
		title="Permanently delete this farm?"
		confirmLabel={pendingAction === 'delete' ? 'Deleting…' : 'Delete Permanently'}
		tone="danger"
		onconfirm={handleConfirmDelete}
		oncancel={() => {
			if (!busy) confirmDeleteOpen = false;
		}}
	>
		{#snippet body()}
			This will permanently remove <strong>{farm.farm_name}</strong> and its application history. This
			can't be undone.
		{/snippet}
	</ConfirmDialog>
{/if}
