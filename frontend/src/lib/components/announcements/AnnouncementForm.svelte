<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Announcement } from '$lib/types/announcement';
	import {
		createAnnouncement,
		deleteAnnouncement,
		updateAnnouncement
	} from '$lib/state/announcements.svelte';
	import { showToast } from '$lib/state/toast.svelte';
	import {
		formatLongDate,
		formatShortDate,
		isStartingNow,
		parseDate,
		statusOf
	} from '$lib/utils/announcement-dates';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import MiniCalendar from './MiniCalendar.svelte';
	import calendarIcon from '$lib/assets/announcements/calendar-20-green.svg';
	import linkIcon from '$lib/assets/announcements/link.svg';
	import boldIcon from '$lib/assets/announcements/bold.svg';
	import italicIcon from '$lib/assets/announcements/italic.svg';
	import underlineIcon from '$lib/assets/announcements/underline.svg';

	const MAX_MESSAGE_LENGTH = 200;

	interface Props {
		heading: string;
		announcement?: Announcement;
	}

	let { heading, announcement }: Props = $props();

	let message = $state(untrack(() => announcement?.message ?? ''));
	let startDate = $state<string | null>(untrack(() => announcement?.startDate ?? null));
	let endDate = $state<string | null>(untrack(() => announcement?.endDate ?? null));
	let calendarMonth = $state(
		untrack(() => {
			const base = announcement ? parseDate(announcement.startDate) : new Date();
			return new Date(base.getFullYear(), base.getMonth(), 1);
		})
	);

	let calendarsOpen = $state(false);
	let confirmKind = $state<'save' | 'delete' | null>(null);
	let datePickerEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();
	let popoverEl: HTMLDivElement | undefined = $state();
	let popoverTop = $state(0);
	let popoverLeft = $state(0);
	let popoverPlaced = $state(false);

	const isEdit = $derived(Boolean(announcement));
	const existingStatus = $derived(announcement ? statusOf(announcement) : null);
	const nextMonth = $derived(
		new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
	);
	const remaining = $derived(MAX_MESSAGE_LENGTH - message.length);
	const dirty = $derived(
		message !== (announcement?.message ?? '') ||
			startDate !== (announcement?.startDate ?? null) ||
			endDate !== (announcement?.endDate ?? null)
	);
	const canSubmit = $derived(
		dirty && message.trim().length > 0 && startDate !== null && endDate !== null
	);
	const submitLabel = $derived(isEdit ? 'Save Changes' : 'Create Announcement');
	const dateLabel = $derived(
		startDate && endDate ? `${formatShortDate(startDate)} to ${formatShortDate(endDate)}` : null
	);
	const startsNow = $derived(startDate ? isStartingNow(startDate) : false);
	const startLabel = $derived(startDate ? formatLongDate(startDate) : '');
	const endLabel = $derived(endDate ? formatLongDate(endDate) : '');

	function placePopover() {
		if (!triggerEl || !popoverEl) return;
		const margin = 12;
		const trigger = triggerEl.getBoundingClientRect();
		const { width, height } = popoverEl.getBoundingClientRect();

		let top = trigger.bottom + margin;
		if (top + height > window.innerHeight - margin) {
			top = Math.max(margin, window.innerHeight - margin - height);
		}

		let left = trigger.left;
		if (left + width > window.innerWidth - margin) {
			left = Math.max(margin, window.innerWidth - margin - width);
		}

		popoverTop = top;
		popoverLeft = left;
		popoverPlaced = true;
	}

	$effect(() => {
		if (!calendarsOpen) {
			popoverPlaced = false;
			return;
		}

		placePopover();

		const reposition = () => placePopover();
		const onPointerDown = (event: PointerEvent) => {
			if (!datePickerEl?.contains(event.target as Node | null)) calendarsOpen = false;
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') calendarsOpen = false;
		};

		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	function selectDate(value: string) {
		if (!startDate || (startDate && endDate)) {
			startDate = value;
			endDate = null;
			return;
		}
		if (value < startDate) {
			startDate = value;
			return;
		}
		endDate = value;
	}

	function shiftMonth(delta: number) {
		calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1);
	}

	function confirmSave() {
		if (!startDate || !endDate) return;
		const data = { message: message.trim(), startDate, endDate };
		if (announcement) {
			updateAnnouncement(announcement.id, data);
			showToast('success', 'Changes saved');
		} else {
			createAnnouncement(data);
			showToast('success', 'Announcement created');
		}
		confirmKind = null;
		goto('/admin/announcements');
	}

	function confirmDelete() {
		if (!announcement) return;
		deleteAnnouncement(announcement.id);
		showToast('delete', 'Announcement deleted');
		confirmKind = null;
		goto('/admin/announcements');
	}

	function cancel() {
		goto('/admin/announcements');
	}
</script>

{#snippet saveBody()}
	{#if isEdit}
		{#if existingStatus === 'active'}
			This will update the live announcement immediately.
		{:else if existingStatus === 'expired'}
			This will update the expired announcement.
		{:else}
			This will update the scheduled announcement.
		{/if}
	{:else if startsNow}
		This announcement will be published <strong>immediately</strong> and become visible to all users until
		its scheduled end date.
	{:else}
		This announcement will be scheduled and automatically become visible on
		<strong>{startLabel}</strong>. It will remain active until <strong>{endLabel}</strong>.
	{/if}
{/snippet}

{#snippet deleteBody()}
	{#if existingStatus === 'active'}
		This announcement is currently live. Deleting it will remove it from the map.
	{:else}
		This scheduled announcement will be deleted.
	{/if}
{/snippet}

<div class="announcement-form">
	<header class="form-header">
		<h1 class="form-heading">{heading}</h1>
		{#if announcement}
			<button class="delete-button" type="button" onclick={() => (confirmKind = 'delete')}>
				Delete
			</button>
		{/if}
	</header>

	<div class="form-body">
		<section class="form-section">
			<h2 class="section-heading">Message</h2>
			<div class="message-box">
				<div class="message-field">
					<label class="message-label" for="announcement-message">Message</label>
					<textarea id="announcement-message" bind:value={message} maxlength={MAX_MESSAGE_LENGTH}
					></textarea>
				</div>
				<div class="message-footer">
					<div class="format-toolbar">
						<button class="format-button" type="button" aria-label="Insert link">
							<img class="icon-link" src={linkIcon} alt="" />
						</button>
						<button class="format-button" type="button" aria-label="Bold">
							<img class="icon-bold" src={boldIcon} alt="" />
						</button>
						<button class="format-button" type="button" aria-label="Italic">
							<img class="icon-italic" src={italicIcon} alt="" />
						</button>
						<button class="format-button" type="button" aria-label="Underline">
							<img class="icon-underline" src={underlineIcon} alt="" />
						</button>
					</div>
					<span class="char-count">{remaining} characters left</span>
				</div>
			</div>
		</section>

		<section class="form-section">
			<h2 class="section-heading">Start Date and Expiration Date</h2>
			<div class="date-picker" bind:this={datePickerEl}>
				<button
					class="select-date-button"
					type="button"
					bind:this={triggerEl}
					aria-expanded={calendarsOpen}
					onclick={() => (calendarsOpen = !calendarsOpen)}
				>
					<img src={calendarIcon} alt="" />
					{dateLabel ?? 'Select Date'}
				</button>

				{#if calendarsOpen}
					<div
						class="calendars-popover"
						bind:this={popoverEl}
						style:top="{popoverTop}px"
						style:left="{popoverLeft}px"
						style:visibility={popoverPlaced ? 'visible' : 'hidden'}
					>
						<MiniCalendar
							month={calendarMonth}
							rangeStart={startDate}
							rangeEnd={endDate}
							onprev={() => shiftMonth(-1)}
							onnext={() => shiftMonth(1)}
							onselect={selectDate}
						/>
						<MiniCalendar
							month={nextMonth}
							rangeStart={startDate}
							rangeEnd={endDate}
							onprev={() => shiftMonth(-1)}
							onnext={() => shiftMonth(1)}
							onselect={selectDate}
						/>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<div class="form-action-bar">
	<div class="form-action-bar-inner">
		<button class="cancel-button" type="button" onclick={cancel}>Cancel</button>
		<button
			class="save-button"
			type="button"
			disabled={!canSubmit}
			onclick={() => (confirmKind = 'save')}
		>
			{submitLabel}
		</button>
	</div>
</div>

{#if confirmKind === 'save'}
	<ConfirmDialog
		title={isEdit ? 'Save Changes?' : 'Create Announcement?'}
		body={saveBody}
		onconfirm={confirmSave}
		oncancel={() => (confirmKind = null)}
	/>
{:else if confirmKind === 'delete'}
	<ConfirmDialog
		title="Delete Announcement?"
		body={deleteBody}
		confirmLabel="Delete"
		tone="danger"
		onconfirm={confirmDelete}
		oncancel={() => (confirmKind = null)}
	/>
{/if}

<style>
	.announcement-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
		padding-bottom: 7rem;
	}

	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.form-heading {
		margin: 0;
		font-family: var(--type-h1-font);
		font-weight: var(--type-h1-weight);
		font-size: var(--type-h1-size);
		line-height: 2.375rem;
		color: var(--color-text-primary);
	}

	.delete-button {
		height: 2.9375rem;
		padding: 0.5rem 0.75rem;
		background: var(--mfsn-secondary-500);
		border: none;
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		color: #ffffff;
		cursor: pointer;
	}

	.delete-button:hover {
		background: var(--mfsn-secondary-600);
	}

	.form-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.9375rem;
	}

	.section-heading {
		margin: 0;
		font-family: var(--type-h2-font);
		font-weight: var(--type-h2-weight);
		font-size: var(--type-h2-size);
		line-height: 2.125rem;
		color: #000000;
	}

	.message-box {
		display: flex;
		flex-direction: column;
		gap: 0.8125rem;
		min-height: 15.4375rem;
		padding: 1.25rem 1.5rem;
		background: var(--color-neutral-0);
		border: 1.5px solid var(--color-neutral-300);
		border-radius: 15px;
	}

	.message-field {
		display: flex;
		flex-direction: column;
		gap: 0.8125rem;
		flex: 1;
	}

	.message-label {
		font-family: var(--type-c1-font);
		font-weight: var(--type-c1-weight);
		font-size: var(--type-c1-size);
		line-height: 1rem;
		color: #000000;
	}

	.message-box textarea {
		flex: 1;
		width: 100%;
		padding: 0;
		background: transparent;
		border: none;
		resize: none;
		font-family: var(--type-b3-font);
		font-weight: var(--type-b3-weight);
		font-size: var(--type-b3-size);
		line-height: 1.5rem;
		color: #000000;
	}

	.message-box textarea:focus {
		outline: none;
		box-shadow: none;
	}

	.message-footer {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.format-toolbar {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		height: 3.25rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-neutral-0);
		border: 0.8px solid var(--color-neutral-300);
		border-radius: 0.5rem;
	}

	.format-button {
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

	.format-button img {
		display: block;
	}

	.icon-link {
		width: 20.49px;
		height: 20.49px;
	}

	.icon-bold {
		width: 15px;
		height: 18px;
	}

	.icon-italic {
		width: 16px;
		height: 18px;
	}

	.icon-underline {
		width: 18px;
		height: 19px;
	}

	.char-count {
		font-family: var(--type-b3-font);
		font-weight: var(--type-b3-weight);
		font-size: var(--type-b3-size);
		line-height: 1.5rem;
		color: var(--color-neutral-500);
	}

	.date-picker {
		position: relative;
		width: fit-content;
	}

	.select-date-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		height: 2.9375rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-neutral-0);
		border: 1px solid var(--mfsn-primary-400);
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		color: var(--mfsn-primary-400);
		cursor: pointer;
	}

	.select-date-button:hover {
		background: var(--mfsn-primary-tint);
	}

	.select-date-button img {
		display: block;
		width: 17px;
		height: 18.67px;
	}

	.calendars-popover {
		position: fixed;
		z-index: 45;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0.75rem;
		max-width: calc(100vw - 1.5rem);
	}

	.form-action-bar {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 40;
		padding: 1.5rem;
		background: var(--color-neutral-0);
	}

	.form-action-bar-inner {
		display: flex;
		justify-content: flex-end;
		gap: 0.8125rem;
		max-width: 64.375rem;
		margin: 0 auto;
	}

	.cancel-button {
		height: 2.9375rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-neutral-0);
		border: 1px solid var(--mfsn-primary-400);
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		color: var(--mfsn-primary-400);
		cursor: pointer;
	}

	.cancel-button:hover {
		background: var(--mfsn-primary-tint);
	}

	.save-button {
		height: 2.9375rem;
		padding: 0.5rem 0.75rem;
		background: var(--mfsn-primary-400);
		border: none;
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		color: #ffffff;
		cursor: pointer;
	}

	.save-button:hover:not(:disabled) {
		background: var(--mfsn-primary-hover);
	}

	.save-button:disabled {
		background: var(--color-neutral-300);
		color: var(--color-neutral-400);
		cursor: not-allowed;
	}
</style>
