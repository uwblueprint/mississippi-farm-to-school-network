<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Announcement } from '$lib/types/announcement';
	import { showToast } from '$lib/state/toast.svelte';
	import {
		formatLongDate,
		formatShortDate,
		isStartingNow,
		parseDate,
		statusOf
	} from '$lib/utils/announcement-dates';
	import { safeHref, serializeRichText, stripHtml } from '$lib/utils/rich-text';
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
	let messageText = $state(untrack(() => stripHtml(announcement?.message ?? '')));
	let baselineMessage = $state(untrack(() => announcement?.message ?? ''));
	let editorEl: HTMLDivElement | undefined = $state();
	let editorReady = false;
	let activeFormats = $state({ bold: false, italic: false, underline: false, link: false });
	let linkFieldOpen = $state(false);
	let linkUrl = $state('');
	let linkInputEl: HTMLInputElement | undefined = $state();
	let savedRange: Range | null = null;
	let startDate = $state<string | null>(untrack(() => announcement?.startDate ?? null));
	let endDate = $state<string | null>(untrack(() => announcement?.endDate || null));
	let submitting = $state(false);
	let leftMonth = $state(
		untrack(() => {
			const base = announcement ? parseDate(announcement.startDate) : new Date();
			return new Date(base.getFullYear(), base.getMonth(), 1);
		})
	);
	let rightMonth = $state(
		untrack(() => {
			const base = announcement ? parseDate(announcement.startDate) : new Date();
			return new Date(base.getFullYear(), base.getMonth() + 1, 1);
		})
	);

	let calendarsOpen = $state(false);
	let confirmKind = $state<'save' | 'delete' | null>(null);
	let datePickerEl: HTMLDivElement | undefined = $state();
	let popoverEl: HTMLDivElement | undefined = $state();
	let popoverHeight = $state(0);

	const isEdit = $derived(Boolean(announcement));
	const existingStatus = $derived(announcement ? statusOf(announcement) : null);
	const remaining = $derived(MAX_MESSAGE_LENGTH - messageText.length);
	const dirty = $derived(
		message !== baselineMessage ||
			startDate !== (announcement?.startDate ?? null) ||
			endDate !== (announcement?.endDate ?? null)
	);
	const canSubmit = $derived(
		dirty &&
			messageText.trim().length > 0 &&
			remaining >= 0 &&
			startDate !== null &&
			endDate !== null
	);
	const submitLabel = $derived(isEdit ? 'Save Changes' : 'Create Announcement');
	const dateLabel = $derived(
		startDate && endDate ? `${formatShortDate(startDate)} to ${formatShortDate(endDate)}` : null
	);
	const startsNow = $derived(startDate ? isStartingNow(startDate) : false);
	const startLabel = $derived(startDate ? formatLongDate(startDate) : '');
	const endLabel = $derived(endDate ? formatLongDate(endDate) : '');

	$effect(() => {
		if (!editorEl || editorReady) return;
		editorEl.innerHTML = untrack(() => announcement?.message ?? '');
		baselineMessage = serializeRichText(editorEl);
		message = baselineMessage;
		messageText = editorEl.textContent ?? '';
		editorReady = true;
	});

	function syncFromEditor() {
		if (!editorEl) return;
		message = serializeRichText(editorEl);
		messageText = editorEl.textContent ?? '';
		refreshActiveFormats();
	}

	function refreshActiveFormats() {
		if (typeof document === 'undefined') return;
		activeFormats = {
			bold: document.queryCommandState('bold'),
			italic: document.queryCommandState('italic'),
			underline: document.queryCommandState('underline'),
			link: Boolean(selectionAnchor())
		};
	}

	function selectionAnchor(): HTMLAnchorElement | null {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || !editorEl) return null;
		let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
		while (node && node !== editorEl) {
			if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
				return node as HTMLAnchorElement;
			}
			node = node.parentNode;
		}
		return null;
	}

	function applyFormat(command: 'bold' | 'italic' | 'underline') {
		if (!editorEl) return;
		editorEl.focus();
		document.execCommand('styleWithCSS', false, 'false');
		document.execCommand(command);
		syncFromEditor();
	}

	function selectRange(range: Range) {
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}

	function showLinkHighlight(range: Range) {
		if (typeof Highlight === 'undefined' || !CSS.highlights) return;
		CSS.highlights.set('link-target', new Highlight(range));
	}

	function clearLinkHighlight() {
		if (typeof CSS === 'undefined' || !CSS.highlights) return;
		CSS.highlights.delete('link-target');
	}

	function toggleLinkField() {
		if (!editorEl) return;

		if (linkFieldOpen) {
			closeLinkField();
			return;
		}

		const existing = selectionAnchor();
		if (existing) {
			editorEl.focus();
			const anchorRange = document.createRange();
			anchorRange.selectNodeContents(existing);
			selectRange(anchorRange);
			document.execCommand('unlink');
			syncFromEditor();
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
		const range = selection.getRangeAt(0);
		if (!editorEl.contains(range.commonAncestorContainer)) return;

		savedRange = range.cloneRange();
		showLinkHighlight(savedRange);
		linkUrl = '';
		linkFieldOpen = true;
		queueMicrotask(() => linkInputEl?.focus());
	}

	function applyLink() {
		const href = safeHref(linkUrl);
		if (!href || !editorEl || !savedRange) return;
		editorEl.focus();
		selectRange(savedRange);
		document.execCommand('createLink', false, href);
		syncFromEditor();
		closeLinkField();
	}

	function closeLinkField() {
		clearLinkHighlight();
		linkFieldOpen = false;
		linkUrl = '';
		savedRange = null;
	}

	function onLinkKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			applyLink();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			closeLinkField();
		}
	}

	function onEditorKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') event.preventDefault();
	}

	function onBeforeInput(event: InputEvent) {
		if (!event.inputType.startsWith('insert')) return;
		const selection = window.getSelection();
		const replacing = selection && !selection.isCollapsed ? selection.toString().length : 0;
		const incoming = event.data?.length ?? 0;
		if (messageText.length - replacing + incoming > MAX_MESSAGE_LENGTH) event.preventDefault();
	}

	function onPaste(event: ClipboardEvent) {
		event.preventDefault();
		const selection = window.getSelection();
		const replacing = selection && !selection.isCollapsed ? selection.toString().length : 0;
		const room = MAX_MESSAGE_LENGTH - (messageText.length - replacing);
		const text = (event.clipboardData?.getData('text/plain') ?? '').replace(/\s+/g, ' ');
		if (room <= 0 || !text) return;
		document.execCommand('insertText', false, text.slice(0, room));
		syncFromEditor();
	}

	$effect(() => {
		if (!calendarsOpen || !popoverEl) {
			popoverHeight = 0;
			return;
		}

		const element = popoverEl;
		popoverHeight = element.offsetHeight;

		const observer = new ResizeObserver(() => {
			popoverHeight = element.offsetHeight;
		});
		observer.observe(element);

		const onPointerDown = (event: PointerEvent) => {
			if (!datePickerEl?.contains(event.target as Node | null)) calendarsOpen = false;
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') calendarsOpen = false;
		};

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			observer.disconnect();
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

	function shiftLeftMonth(delta: number) {
		leftMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + delta, 1);
	}

	function shiftRightMonth(delta: number) {
		rightMonth = new Date(rightMonth.getFullYear(), rightMonth.getMonth() + delta, 1);
	}

	async function submitRequest(url: string, method: string, body?: object) {
		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				...(body ? { body: JSON.stringify(body) } : {})
			});
			const result = await res.json();
			if (!result.ok) {
				return result.errors?.[0]?.message ?? 'Something went wrong. Please try again.';
			}
			return null;
		} catch {
			return 'Something went wrong. Please try again.';
		}
	}

	async function confirmSave() {
		if (!startDate || !endDate || submitting) return;
		submitting = true;
		const failure = announcement
			? await submitRequest(`/api/announcements/${announcement.id}`, 'PATCH', {
					message,
					startDate,
					endDate
				})
			: await submitRequest('/api/announcements', 'POST', { message, startDate, endDate });
		submitting = false;
		confirmKind = null;
		if (failure) {
			showToast('error', failure);
			return;
		}
		showToast('success', announcement ? 'Changes saved' : 'Announcement created');
		goto('/admin/announcements', { invalidateAll: true });
	}

	async function confirmDelete() {
		if (!announcement || submitting) return;
		submitting = true;
		const failure = await submitRequest(`/api/announcements/${announcement.id}`, 'DELETE');
		submitting = false;
		confirmKind = null;
		if (failure) {
			showToast('error', failure);
			return;
		}
		showToast('delete', 'Announcement deleted');
		goto('/admin/announcements', { invalidateAll: true });
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

<div class="announcement-form" style:--popover-reserve="{calendarsOpen ? popoverHeight + 12 : 0}px">
	<header class="form-header">
		<h1 class="form-heading">{heading}</h1>
		{#if announcement && existingStatus !== 'expired'}
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
					<span class="message-label" id="message-label">Message</span>
					<div
						class="message-input"
						bind:this={editorEl}
						contenteditable="true"
						role="textbox"
						tabindex="0"
						aria-multiline="false"
						aria-labelledby="message-label"
						oninput={syncFromEditor}
						onkeyup={refreshActiveFormats}
						onmouseup={refreshActiveFormats}
						onfocus={refreshActiveFormats}
						onkeydown={onEditorKeyDown}
						onbeforeinput={onBeforeInput}
						onpaste={onPaste}
					></div>
				</div>

				{#if linkFieldOpen}
					<div class="link-field">
						<input
							class="link-input"
							type="url"
							placeholder="https://example.com"
							bind:this={linkInputEl}
							bind:value={linkUrl}
							onkeydown={onLinkKeyDown}
						/>
						<button class="link-apply" type="button" onclick={applyLink}>Apply</button>
						<button class="link-cancel" type="button" onclick={closeLinkField}>Cancel</button>
					</div>
				{/if}
				<div class="message-footer">
					<div class="format-toolbar">
						<button
							class="format-button"
							class:format-button--active={linkFieldOpen || activeFormats.link}
							type="button"
							aria-label="Insert link"
							aria-pressed={linkFieldOpen || activeFormats.link}
							onmousedown={(event) => event.preventDefault()}
							onclick={toggleLinkField}
						>
							<img class="icon-link" src={linkIcon} alt="" />
						</button>
						<button
							class="format-button"
							class:format-button--active={activeFormats.bold}
							type="button"
							aria-label="Bold"
							aria-pressed={activeFormats.bold}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => applyFormat('bold')}
						>
							<img class="icon-bold" src={boldIcon} alt="" />
						</button>
						<button
							class="format-button"
							class:format-button--active={activeFormats.italic}
							type="button"
							aria-label="Italic"
							aria-pressed={activeFormats.italic}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => applyFormat('italic')}
						>
							<img class="icon-italic" src={italicIcon} alt="" />
						</button>
						<button
							class="format-button"
							class:format-button--active={activeFormats.underline}
							type="button"
							aria-label="Underline"
							aria-pressed={activeFormats.underline}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => applyFormat('underline')}
						>
							<img class="icon-underline" src={underlineIcon} alt="" />
						</button>
					</div>
					<span class="char-count" class:char-count--over={remaining < 0}>
						{remaining} characters left
					</span>
				</div>
			</div>
		</section>

		<section class="form-section">
			<h2 class="section-heading">Start Date and Expiration Date</h2>
			<div class="date-picker" bind:this={datePickerEl}>
				<button
					class="select-date-button"
					type="button"
					aria-expanded={calendarsOpen}
					onclick={() => (calendarsOpen = !calendarsOpen)}
				>
					<img src={calendarIcon} alt="" />
					{dateLabel ?? 'Select Date'}
				</button>

				{#if calendarsOpen}
					<div class="calendars-popover" bind:this={popoverEl}>
						<MiniCalendar
							month={leftMonth}
							rangeStart={startDate}
							rangeEnd={endDate}
							onprev={() => shiftLeftMonth(-1)}
							onnext={() => shiftLeftMonth(1)}
							onselect={selectDate}
						/>
						<MiniCalendar
							month={rightMonth}
							rangeStart={startDate}
							rangeEnd={endDate}
							onprev={() => shiftRightMonth(-1)}
							onnext={() => shiftRightMonth(1)}
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
		padding-bottom: calc(7rem + var(--popover-reserve, 0px));
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

	.message-input {
		flex: 1;
		width: 100%;
		font-family: var(--type-b3-font);
		font-weight: var(--type-b3-weight);
		font-size: var(--type-b3-size);
		line-height: 1.5rem;
		color: #000000;
		outline: none;
	}

	:global(::highlight(link-target)) {
		background-color: Highlight;
		color: HighlightText;
	}

	.message-input :global(a) {
		color: var(--mfsn-primary-500);
		text-decoration: underline;
	}

	.link-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.link-input {
		flex: 1;
		min-width: 0;
		height: 2.25rem;
		padding: 0.25rem 0.625rem;
		background: var(--color-neutral-0);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		font-family: var(--type-b3-font);
		font-size: var(--text-c1);
		color: var(--color-text-primary);
	}

	.link-apply,
	.link-cancel {
		height: 2.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		cursor: pointer;
	}

	.link-apply {
		background: var(--mfsn-primary-400);
		border: none;
		color: #ffffff;
	}

	.link-cancel {
		background: var(--color-neutral-0);
		border: 1px solid var(--color-neutral-300);
		color: var(--color-text-secondary);
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

	.format-button--active {
		background: var(--color-neutral-200);
		border-radius: 0.25rem;
	}

	.char-count--over {
		color: var(--mfsn-secondary-500);
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
		position: absolute;
		top: calc(100% + 0.75rem);
		left: 0;
		z-index: 45;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0.75rem;
		width: max-content;
		max-width: calc(100vw - 3rem);
	}

	.form-action-bar {
		position: fixed;
		right: 0;
		bottom: 0;
		left: var(--admin-sidebar-width, 0px);
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
