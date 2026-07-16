<script lang="ts">
	import { onMount } from 'svelte';
	import GalleryTile from '$lib/components/GalleryTile.svelte';
	import { IMAGE_ACCEPT, filesFromDrop, suppressWindowDrop } from '$lib/fileDrop';

	interface Props {
		photos: { id: string; url?: string }[];
		/** Click handler for the "Add Photos" tile (opens the caller's file picker). */
		onAdd?: () => void;
		onRemove?: (id: string) => void;
		/** Files dropped onto the "Add Photos" tile. Omit to disable drag-and-drop. */
		onFiles?: (files: FileList) => void;
		accept?: string;
	}

	let { photos, onAdd, onRemove, onFiles, accept = IMAGE_ACCEPT }: Props = $props();

	const droppable = $derived(!!onFiles);

	let isDragging = $state(false);
	let dropError = $state('');
	// dragenter/dragleave also fire crossing child elements — count depth so the
	// highlight doesn't flicker.
	let dragDepth = 0;

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		if (!droppable) return;
		dragDepth += 1;
		isDragging = true;
	}

	function handleDragOver(event: DragEvent) {
		// Required: without preventDefault the browser refuses the drop entirely.
		event.preventDefault();
		if (droppable && event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
	}

	function handleDragLeave() {
		if (!droppable) return;
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragDepth = 0;
		isDragging = false;
		if (!droppable) return;

		const { files, error } = filesFromDrop(event, accept, true);
		dropError = error;
		if (files) onFiles?.(files);
	}

	onMount(() => (droppable ? suppressWindowDrop() : undefined));
</script>

<div class="gallery-grid">
	{#each photos as photo (photo.id)}
		<GalleryTile imageUrl={photo.url} onRemove={onRemove ? () => onRemove(photo.id) : undefined} />
	{/each}
	<button
		type="button"
		class="gallery-add"
		class:gallery-add--dragging={isDragging}
		onclick={onAdd}
		ondragenter={handleDragEnter}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<span class="gallery-add__plus">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path d="M12 5V19M5 12H19" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<!-- Resting label matches the mock; swap it only while dragging. -->
		<span class="gallery-add__label">{isDragging ? 'Drop to upload' : 'Add Photos'}</span>
	</button>
</div>
{#if dropError}
	<p class="gallery-error" role="alert">{dropError}</p>
{/if}

<style>
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
		gap: 12px;
	}

	.gallery-add {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		aspect-ratio: 1 / 1;
		border: 2px dashed #d9d9d9;
		border-radius: 12px;
		background: #fff;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	/* Drag-over affordance; matches UploadZone's. */
	.gallery-add--dragging {
		border-color: #587244;
		background: #f2f6ef;
	}

	.gallery-error {
		margin: 8px 0 0;
		color: #c4341f;
		font-size: 14px;
		font-weight: 400;
	}

	.gallery-add__plus {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.gallery-add__plus svg {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.gallery-add__label {
		color: #000;
		text-align: center;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		font-weight: 400;
		line-height: 16px;
	}
</style>
