<script lang="ts">
	import type { Announcement } from '$lib/types/announcement';
	import { formatLongDate, statusOf } from '$lib/utils/announcement-dates';
	import StatusTag from './StatusTag.svelte';
	import calendarIcon from '$lib/assets/announcements/calendar-16.svg';
	import arrowIcon from '$lib/assets/announcements/arrow-narrow-right.svg';
	import editIcon from '$lib/assets/announcements/edit.svg';
	import closeIcon from '$lib/assets/announcements/x-close.svg';

	interface Props {
		announcement: Announcement;
		variant?: 'default' | 'popup';
		onclose?: () => void;
	}

	let { announcement, variant = 'default', onclose }: Props = $props();

	const status = $derived(statusOf(announcement));
</script>

<article class="announcement-card" class:announcement-card--popup={variant === 'popup'}>
	<div class="card-details">
		<StatusTag {status} />
		<p class="card-message">{announcement.message}</p>
		<div class="card-dates">
			<img class="icon-calendar" src={calendarIcon} alt="" />
			<span>{formatLongDate(announcement.startDate)}</span>
			<img class="icon-arrow" src={arrowIcon} alt="" />
			<span>{formatLongDate(announcement.endDate)}</span>
		</div>
	</div>

	{#if variant === 'popup'}
		<div class="popup-actions">
			<a
				class="popup-action"
				href="/admin/announcements/{announcement.id}"
				aria-label="Edit announcement"
			>
				<img class="icon-edit" src={editIcon} alt="" />
			</a>
			<button class="popup-action" type="button" aria-label="Close" onclick={onclose}>
				<img class="icon-close" src={closeIcon} alt="" />
			</button>
		</div>
	{:else}
		<a
			class="edit-button"
			class:edit-button--hidden={status === 'expired'}
			href="/admin/announcements/{announcement.id}"
			aria-label="Edit announcement"
		>
			<img class="icon-edit" src={editIcon} alt="" />
		</a>
	{/if}
</article>

<style>
	.announcement-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 1.25rem 1.5rem;
		background: var(--color-neutral-0);
		border: 1px solid var(--color-neutral-300);
		border-radius: 15px;
	}

	.announcement-card--popup {
		align-items: flex-start;
		border: 1.5px solid var(--color-neutral-200);
		box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
	}

	.card-details {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.card-message {
		margin: 0;
		font-family: var(--type-s2-font);
		font-weight: var(--type-s2-weight);
		font-size: var(--type-s2-size);
		line-height: 1.5rem;
		color: #000000;
	}

	.card-dates {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--type-c1-font);
		font-weight: var(--type-c1-weight);
		font-size: var(--type-c1-size);
		line-height: 1rem;
		color: var(--color-neutral-500);
	}

	.card-dates img {
		display: block;
	}

	.icon-calendar {
		width: 13.25px;
		height: 14.58px;
	}

	.icon-arrow {
		width: 12.17px;
		height: 9.5px;
	}

	.icon-edit {
		display: block;
		width: 21.33px;
		height: 21.33px;
	}

	.icon-close {
		display: block;
		width: 12px;
		height: 12px;
	}

	.edit-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: var(--color-neutral-0);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
	}

	.edit-button:hover {
		background: var(--color-neutral-100);
	}

	.edit-button--hidden {
		visibility: hidden;
	}

	.popup-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.popup-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}
</style>
