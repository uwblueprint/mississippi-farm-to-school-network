<script lang="ts">
	import { CHANGE_REASONS } from '$lib/constants/admin-request';

	export type ReviewCardView = 'review' | 'approve-confirm' | 'request-changes';

	interface Props {
		cardView: ReviewCardView;
		submitting: boolean;
		actionError: string | null;
		selectedReasons: Set<string>;
		changeDetails: string;
		contactHref: string;
		canSubmitChanges: boolean;
		onCardViewChange: (view: ReviewCardView) => void;
		onToggleReason: (reason: string) => void;
		onChangeDetails: (value: string) => void;
		onConfirmApprove: () => void;
		onSubmitChanges: () => void;
	}

	let {
		cardView,
		submitting,
		actionError,
		selectedReasons,
		changeDetails,
		contactHref,
		canSubmitChanges,
		onCardViewChange,
		onToggleReason,
		onChangeDetails,
		onConfirmApprove,
		onSubmitChanges
	}: Props = $props();
</script>

<div class="review-application-card">
	{#if cardView === 'review'}
		<div class="review-application-card__copy">
			<h3 class="review-application-card__title">Review Application</h3>
			<p class="review-application-card__body">
				Review the information submitted by the farm.
			</p>
			<p class="review-application-card__body">
				Choose <strong>Approve</strong> to publish the farm profile, or
				<strong> Request Changes</strong> if additional information or corrections are needed.
			</p>
		</div>

		<div class="review-application-card__actions">
			<button
				type="button"
				class="review-application-card__approve"
				onclick={() => onCardViewChange('approve-confirm')}
			>
				Approve
				<img src="/images/admin/checkWhiteIcon.svg" alt="" />
			</button>
			<button
				type="button"
				class="review-application-card__changes"
				onclick={() => onCardViewChange('request-changes')}
			>
				Request Changes
				<img src="/images/admin/requestChangesXIcon.svg" alt="" />
			</button>
		</div>
	{:else if cardView === 'approve-confirm'}
		<div class="review-application-card__copy">
			<span class="review-application-card__icon review-application-card__icon--success">
				<img src="/images/admin/approveCheckIcon.svg" alt="" />
			</span>
			<h3 class="review-application-card__title">Approve Application?</h3>
			<p class="review-application-card__body">
				This will email the farm confirming their approval. This action is not reversible.
			</p>
			{#if actionError}
				<p class="review-application-card__error">{actionError}</p>
			{/if}
		</div>

		<div class="review-application-card__actions">
			<button
				type="button"
				class="review-application-card__changes"
				disabled={submitting}
				onclick={() => onCardViewChange('review')}
			>
				Cancel
			</button>
			<button
				type="button"
				class="review-application-card__approve"
				disabled={submitting}
				onclick={onConfirmApprove}
			>
				{submitting ? 'Approving…' : 'Confirm'}
			</button>
		</div>
	{:else}
		<div class="review-application-card__copy">
			<span class="review-application-card__icon review-application-card__icon--alert">!</span>
			<h3 class="review-application-card__title">Requested Changes to Application</h3>
			<p class="review-application-card__body">
				Submitting will mark the farm as needing changes and email the applicant with your reason.
			</p>

			<p class="review-application-card__section-label">Reason for requested changes</p>
			<div class="review-application-card__reasons">
				{#each CHANGE_REASONS as reason (reason)}
					<label class="review-application-card__reason">
						<input
							type="checkbox"
							class="review-application-card__checkbox"
							checked={selectedReasons.has(reason)}
							disabled={submitting}
							onchange={() => onToggleReason(reason)}
						/>
						<span class="review-application-card__reason-label">{reason}</span>
					</label>
				{/each}
			</div>

			<p class="review-application-card__section-label">Please provide more details</p>
			<textarea
				class="review-application-card__textarea"
				placeholder="e.g. Missing phone number"
				disabled={submitting}
				value={changeDetails}
				oninput={(event) => onChangeDetails(event.currentTarget.value)}
			></textarea>

			{#if actionError}
				<p class="review-application-card__error">{actionError}</p>
			{/if}

			<p class="review-application-card__body">
				<a href={contactHref}>Contact Applicant</a>
			</p>
		</div>

		<div class="review-application-card__actions">
			<button
				type="button"
				class="review-application-card__changes"
				disabled={submitting}
				onclick={() => onCardViewChange('review')}
			>
				Cancel
			</button>
			<button
				type="button"
				class="review-application-card__approve"
				disabled={submitting || !canSubmitChanges}
				onclick={onSubmitChanges}
			>
				{submitting ? 'Submitting…' : 'Submit'}
			</button>
		</div>
	{/if}
</div>
