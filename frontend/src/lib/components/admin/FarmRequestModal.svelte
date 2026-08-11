<script lang="ts">
	import { goto } from '$app/navigation';

	import FarmRequestContact from '$lib/components/admin/FarmRequestContact.svelte';
	import FarmRequestGallery from '$lib/components/admin/FarmRequestGallery.svelte';
	import FarmRequestReviewPanel from '$lib/components/admin/FarmRequestReviewPanel.svelte';
	import type { ReviewCardView } from '$lib/components/admin/FarmRequestReviewPanel.svelte';
	import FarmRequestSections from '$lib/components/admin/FarmRequestSections.svelte';
	import ConfirmDialog from '$lib/components/announcements/ConfirmDialog.svelte';
	import {
		MAP_TAG_MODIFIER,
		REQUEST_TYPE_LABEL,
		REQUEST_TYPE_MODIFIER
	} from '$lib/constants/admin-request';
	import { gqlClient } from '$lib/graphqlClient';
	import type { PendingRequest } from '$lib/types/admin';
	import {
		APPROVE_FARM_MUTATION,
		ARCHIVE_FARM_MUTATION,
		REJECT_FARM_MUTATION,
		pendingFarmMapTag,
		pendingFarmOwner
	} from '$lib/utils/pending-request-adapter';
	import { formatRelativeTime } from '$lib/utils/relative-time';

	interface Props {
		request: PendingRequest;
		onClose: () => void;
		/** Called after a successful approve, reject, or archive so the parent can refresh. */
		onResolved?: (request: PendingRequest) => void;
	}

	let { request, onClose, onResolved }: Props = $props();

	let cardView = $state<ReviewCardView>('review');
	let selectedReasons = $state<Set<string>>(new Set());
	let changeDetails = $state('');
	let submitting = $state(false);
	let actionError = $state<string | null>(null);
	let menuOpen = $state(false);
	let confirmDeleteOpen = $state(false);
	let menuRoot = $state<HTMLDivElement | null>(null);

	const farm = $derived(request.farm);
	const owner = $derived(pendingFarmOwner(farm));
	const mapTag = $derived(pendingFarmMapTag(farm));
	const submittedLabel = $derived(`Submitted ${formatRelativeTime(farm.updatedAt)}`);
	const contactHref = $derived(`mailto:${owner.email}`);
	const canSubmitChanges = $derived(selectedReasons.size > 0 || changeDetails.trim().length > 0);

	// Body scroll lock + Escape — independent of farm / form state.
	$effect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		function onKeydown(event: KeyboardEvent) {
			if (event.key !== 'Escape' || submitting || confirmDeleteOpen) return;
			if (menuOpen) {
				menuOpen = false;
				return;
			}
			onClose();
		}

		window.addEventListener('keydown', onKeydown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKeydown);
		};
	});

	// Reset review form whenever the open request changes.
	$effect(() => {
		void request.farm.id;
		cardView = 'review';
		selectedReasons = new Set();
		changeDetails = '';
		submitting = false;
		actionError = null;
		menuOpen = false;
		confirmDeleteOpen = false;
	});

	function handleBackdropClick(event: MouseEvent) {
		if (submitting || confirmDeleteOpen) return;
		if (event.target === event.currentTarget) onClose();
	}

	function handleWindowClick(event: MouseEvent) {
		if (!menuOpen || !menuRoot) return;
		if (!menuRoot.contains(event.target as Node)) {
			menuOpen = false;
		}
	}

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		if (submitting) return;
		menuOpen = !menuOpen;
	}

	function toggleReason(reason: string) {
		const next = new Set(selectedReasons);
		if (next.has(reason)) {
			next.delete(reason);
		} else {
			next.add(reason);
		}
		selectedReasons = next;
	}

	function buildRejectionReason(): string {
		const reasons = [...selectedReasons];
		const details = changeDetails.trim();
		if (reasons.length && details) return `${reasons.join('; ')} - ${details}`;
		if (reasons.length) return reasons.join('; ');
		return details;
	}

	async function handleConfirmApprove() {
		if (submitting) return;
		submitting = true;
		actionError = null;

		try {
			await gqlClient(APPROVE_FARM_MUTATION, { id: request.farm.id });
			onResolved?.(request);
			onClose();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Failed to approve farm.';
		} finally {
			submitting = false;
		}
	}

	async function handleSubmitChanges() {
		if (submitting || !canSubmitChanges) return;
		submitting = true;
		actionError = null;

		try {
			await gqlClient(REJECT_FARM_MUTATION, {
				id: request.farm.id,
				rejectionReason: buildRejectionReason()
			});
			onResolved?.(request);
			onClose();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Failed to request changes.';
		} finally {
			submitting = false;
		}
	}

	function handleEdit() {
		menuOpen = false;
		const returnTo = encodeURIComponent('/admin');
		void goto(`/farmer/farms/${request.farm.id}/edit?returnTo=${returnTo}`);
	}

	function handleDeleteClick() {
		menuOpen = false;
		confirmDeleteOpen = true;
	}

	async function handleConfirmDelete() {
		if (submitting) return;
		submitting = true;
		actionError = null;

		try {
			await gqlClient(ARCHIVE_FARM_MUTATION, { id: request.farm.id });
			confirmDeleteOpen = false;
			onResolved?.(request);
			onClose();
		} catch (error) {
			confirmDeleteOpen = false;
			actionError = error instanceof Error ? error.message : 'Failed to delete farm.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="farm-request-overlay" role="presentation" onclick={handleBackdropClick}>
	<div
		class="farm-request-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="farm-request-modal-title"
	>
		<div class="farm-request-modal__toolbar">
			<div class="farm-request-modal__menu-wrap" bind:this={menuRoot}>
				<button
					type="button"
					class="farm-request-modal__icon-btn farm-request-modal__icon-btn--dots"
					aria-label="More options"
					aria-expanded={menuOpen}
					aria-haspopup="menu"
					disabled={submitting}
					onclick={toggleMenu}
				>
					<img src="/images/admin/dotsVerticalIcon.svg" alt="" />
				</button>

				{#if menuOpen}
					<ul class="farm-request-modal__menu" role="menu" aria-label="Farm actions">
						<li role="presentation">
							<button
								type="button"
								class="farm-request-modal__menu-item"
								role="menuitem"
								disabled={submitting}
								onclick={handleEdit}
							>
								Edit
							</button>
						</li>
						<li role="presentation">
							<button
								type="button"
								class="farm-request-modal__menu-item farm-request-modal__menu-item--danger"
								role="menuitem"
								disabled={submitting}
								onclick={handleDeleteClick}
							>
								Delete
							</button>
						</li>
					</ul>
				{/if}
			</div>

			<button
				type="button"
				class="farm-request-modal__icon-btn farm-request-modal__icon-btn--close"
				aria-label="Close"
				disabled={submitting}
				onclick={onClose}
			>
				<img src="/images/admin/closeIcon.svg" alt="" />
			</button>
		</div>

		<div class="farm-request-modal__columns">
			<div class="farm-request-modal__details">
				<div class="farm-request-modal__meta">
					<span class="request-pill request-pill--{REQUEST_TYPE_MODIFIER[request.requestType]}">
						{REQUEST_TYPE_LABEL[request.requestType]}
					</span>
					<span class="request-card__dot"></span>
					<span class="farm-request-modal__submitted">{submittedLabel}</span>
				</div>

				<div class="farm-request-modal__title-row">
					<h2 id="farm-request-modal-title" class="farm-request-modal__title">
						{farm.farm_name}
					</h2>
					{#if mapTag}
						<span class="request-pill request-pill--{MAP_TAG_MODIFIER[mapTag]}">
							{mapTag}
						</span>
					{/if}
				</div>

				<FarmRequestContact {farm} />
				<FarmRequestSections {farm} />
			</div>

			<aside class="farm-request-modal__aside">
				<FarmRequestGallery
					farmId={farm.id}
					farmName={farm.farm_name}
					coverPhoto={farm.cover_photo}
					carouselPhotos={farm.carousel_photos}
				/>
				<FarmRequestReviewPanel
					{cardView}
					{submitting}
					{actionError}
					{selectedReasons}
					{changeDetails}
					{contactHref}
					{canSubmitChanges}
					onCardViewChange={(view) => (cardView = view)}
					onToggleReason={toggleReason}
					onChangeDetails={(value) => (changeDetails = value)}
					onConfirmApprove={handleConfirmApprove}
					onSubmitChanges={handleSubmitChanges}
				/>
			</aside>
		</div>
	</div>
</div>

{#if confirmDeleteOpen}
	<ConfirmDialog
		title="Delete this farm?"
		confirmLabel={submitting ? 'Deleting…' : 'Delete'}
		tone="danger"
		onconfirm={() => void handleConfirmDelete()}
		oncancel={() => {
			if (!submitting) confirmDeleteOpen = false;
		}}
	>
		{#snippet body()}
			This will archive <strong>{farm.farm_name}</strong> and remove it from the pending queue. You can
			restore it later from archived farms.
		{/snippet}
	</ConfirmDialog>
{/if}
