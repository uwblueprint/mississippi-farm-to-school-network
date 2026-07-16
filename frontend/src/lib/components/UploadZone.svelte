<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		title: string;
		hint: string;
		/**
		 * Optional file wiring. When provided, the zone becomes interactive: click
		 * to open a hidden <input type="file">, or drag-and-drop files onto it.
		 * Omit it to keep the original static visual.
		 */
		onFiles?: (files: FileList) => void;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
	}

	let {
		title,
		hint,
		onFiles,
		accept = 'image/png,image/jpeg',
		multiple = true,
		disabled = false
	}: Props = $props();

	const interactive = $derived(!!onFiles);

	let input = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);
	let dropError = $state('');
	// dragenter/dragleave also fire when the pointer crosses child elements, so
	// track depth to keep the highlight from flickering.
	let dragDepth = 0;

	function open() {
		if (!disabled) input?.click();
	}

	function handleChange(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		if (el.files && el.files.length > 0) onFiles?.(el.files);
		// reset so picking the same file again still fires a change event
		el.value = '';
	}

	// The file picker enforces `accept`, but a drop does NOT — anything can be
	// dropped, so filter here to keep non-images out of the uploader.
	function isAccepted(file: File): boolean {
		const patterns = accept
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);
		if (patterns.length === 0) return true;
		return patterns.some((pattern) => {
			if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
			if (pattern.endsWith('/*')) return file.type.startsWith(pattern.slice(0, -1));
			return file.type === pattern;
		});
	}

	// onFiles takes a FileList (same contract as the <input> path), so rebuild one
	// from the filtered files rather than passing dataTransfer.files straight in.
	function toFileList(files: File[]): FileList {
		const transfer = new DataTransfer();
		for (const file of files) transfer.items.add(file);
		return transfer.files;
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		if (disabled || !interactive) return;
		dragDepth += 1;
		isDragging = true;
	}

	function handleDragOver(event: DragEvent) {
		// Required: without preventDefault the browser refuses the drop entirely.
		event.preventDefault();
		if (!disabled && interactive && event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDragLeave() {
		if (disabled || !interactive) return;
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragDepth = 0;
		isDragging = false;
		if (disabled || !interactive) return;

		const dropped = Array.from(event.dataTransfer?.files ?? []);
		if (dropped.length === 0) return;

		let valid = dropped.filter(isAccepted);
		if (!multiple) valid = valid.slice(0, 1);

		if (valid.length === 0) {
			dropError = 'Only JPG or PNG images can be uploaded.';
			return;
		}
		dropError = valid.length < dropped.length ? 'Some files were skipped — JPG or PNG only.' : '';
		onFiles?.(toFileList(valid));
	}

	// Dropping a file anywhere outside a drop zone makes the browser navigate to
	// it, which would silently discard unsaved form edits. Suppress that default
	// while a zone is mounted; element-level drop handlers still run normally.
	function suppressWindowDrop(event: DragEvent) {
		event.preventDefault();
	}

	onMount(() => {
		if (!interactive) return;
		window.addEventListener('dragover', suppressWindowDrop);
		window.addEventListener('drop', suppressWindowDrop);
		return () => {
			window.removeEventListener('dragover', suppressWindowDrop);
			window.removeEventListener('drop', suppressWindowDrop);
		};
	});
</script>

{#snippet inner()}
	<span class="upload-zone__icon">
		<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none" aria-hidden="true">
			<path d="M30.625 21.875V23.625C30.625 26.0752 30.625 27.3003 30.1482 28.2362C29.7287 29.0594 29.0594 29.7287 28.2362 30.1482C27.3003 30.625 26.0752 30.625 23.625 30.625H11.375C8.92477 30.625 7.69966 30.625 6.76379 30.1482C5.94058 29.7287 5.27129 29.0594 4.85185 28.2362C4.375 27.3003 4.375 26.0752 4.375 23.625V21.875M10.2083 11.6667L17.5 4.375L24.7917 11.6667M17.5 4.375V21.875" stroke="black" stroke-width="2.91667" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</span>
	<!-- Swap the title while dragging so the resting design still matches the
	     mock, but a drag gets unmistakable feedback. -->
	<span class="upload-zone__title">{isDragging ? 'Drop to upload' : title}</span>
	<span class="upload-zone__hint">{hint}</span>
{/snippet}

{#if interactive}
	<button
		type="button"
		class="upload-zone"
		class:upload-zone--dragging={isDragging}
		onclick={open}
		ondragenter={handleDragEnter}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		{disabled}
	>
		{@render inner()}
	</button>
	{#if dropError}
		<p class="upload-zone__error" role="alert">{dropError}</p>
	{/if}
	<input
		bind:this={input}
		class="upload-zone__file"
		type="file"
		{accept}
		{multiple}
		onchange={handleChange}
	/>
{:else}
	<div class="upload-zone">
		{@render inner()}
	</div>
{/if}

<style>
	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 49px 24px 29px;
		border: 1px dashed #c5c8d8;
		border-radius: 12px;
		text-align: center;
	}

	/* When rendered as a button, strip native chrome and keep the div visual. */
	button.upload-zone {
		width: 100%;
		background: transparent;
		font: inherit;
		color: inherit;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	button.upload-zone:disabled {
		opacity: 0.6;
		cursor: default;
	}

	/* Drag-over affordance. Scoped to button.* to beat button.upload-zone's
	   transparent background. */
	button.upload-zone--dragging {
		border-color: #587244;
		background: #f2f6ef;
	}

	.upload-zone__file {
		display: none;
	}

	/* Pull up out of the parent section's flex gap so it hugs the zone above. */
	.upload-zone__error {
		margin: -28px 0 0;
		color: #c4341f;
		font-size: 14px;
		font-weight: 400;
	}

	.upload-zone__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 65px;
		height: 65px;
		flex-shrink: 0;
		border-radius: 32.5px;
		border: 1px solid #d6d6d6;
		background: #fff;
	}

	.upload-zone__icon svg {
		width: 35px;
		height: 35px;
		flex-shrink: 0;
	}

	.upload-zone__title {
		color: #000;
		text-align: center;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 22.711px;
		font-weight: 500;
		line-height: 38.933px;
	}

	.upload-zone__hint {
		color: #000;
		text-align: center;
		font-size: 14px;
		font-weight: 400;
		line-height: 16px;
		align-self: stretch;
	}
</style>
