<script lang="ts">
	import FarmModalShell from '$lib/components/admin/FarmModalShell.svelte';
	import FarmRequestContact from '$lib/components/admin/FarmRequestContact.svelte';
	import FarmRequestGallery from '$lib/components/admin/FarmRequestGallery.svelte';
	import FarmRequestReviewPanel from '$lib/components/admin/FarmRequestReviewPanel.svelte';
	import type { ReviewCardView } from '$lib/components/admin/FarmRequestReviewPanel.svelte';
	import FarmRequestSections from '$lib/components/admin/FarmRequestSections.svelte';
	import {
		MAP_TAG_MODIFIER,
		REQUEST_TYPE_LABEL,
		REQUEST_TYPE_MODIFIER
	} from '$lib/constants/admin-request';
	import { gqlClient } from '$lib/graphqlClient';
	import type { PendingRequest } from '$lib/types/admin';
	import {
		APPROVE_FARM_MUTATION,
		REJECT_FARM_MUTATION,
		pendingFarmMapTag,
		pendingFarmOwner
	} from '$lib/utils/pending-request-adapter';
	import { buildReviewSections } from '$lib/utils/farm-request-sections';
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

	const farm = $derived(request.farm);
	const sections = $derived(buildReviewSections(farm));
	const owner = $derived(pendingFarmOwner(farm));
	const mapTag = $derived(pendingFarmMapTag(farm));
	const submittedLabel = $derived(`Submitted ${formatRelativeTime(farm.updatedAt)}`);
	const contactHref = $derived(`mailto:${owner.email}`);
	const canSubmitChanges = $derived(selectedReasons.size > 0 || changeDetails.trim().length > 0);

	// Reset review form whenever the open request changes.
	$effect(() => {
		void request.farm.id;
		cardView = 'review';
		selectedReasons = new Set();
		changeDetails = '';
		submitting = false;
		actionError = null;
	});

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

	function handleArchived() {
		onResolved?.(request);
	}
</script>

<FarmModalShell
	farmId={farm.id}
	farmName={farm.farm_name}
	titleId="farm-request-modal-title"
	returnTo="/admin"
	removalContext="the pending queue"
	menuDisabled={submitting}
	closeDisabled={submitting}
	blockClose={submitting}
	{onClose}
	onArchived={handleArchived}
>
	{#snippet children()}
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
				<FarmRequestSections {sections} />
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
	{/snippet}
</FarmModalShell>
