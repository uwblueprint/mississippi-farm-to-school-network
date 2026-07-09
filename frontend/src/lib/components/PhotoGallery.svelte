<script lang="ts">
	import GalleryTile from '$lib/components/GalleryTile.svelte';

	interface Props {
		photos: { id: string; url?: string }[];
		onAdd?: () => void;
		onRemove?: (id: string) => void;
	}

	let { photos, onAdd, onRemove }: Props = $props();
</script>

<div class="gallery-grid">
	{#each photos as photo (photo.id)}
		<GalleryTile imageUrl={photo.url} onRemove={onRemove ? () => onRemove(photo.id) : undefined} />
	{/each}
	<button type="button" class="gallery-add" onclick={onAdd}>
		<span class="gallery-add__plus">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path d="M12 5V19M5 12H19" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span class="gallery-add__label">Add Photos</span>
	</button>
</div>

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
