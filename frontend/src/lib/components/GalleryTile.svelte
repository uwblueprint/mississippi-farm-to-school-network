<script lang="ts">
	interface Props {
		imageUrl?: string;
		onRemove?: () => void;
	}

	let { imageUrl = '', onRemove }: Props = $props();
</script>

<div class="gallery-item">
	<div class="gallery-item__media">
		{#if imageUrl}<img src={imageUrl} alt="" />{/if}
	</div>
	<button type="button" class="gallery-item__remove" aria-label="Remove photo" onclick={onRemove}>
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<rect x="0.5" y="0.5" width="23" height="23" rx="11.5" fill="white" />
			<rect x="0.5" y="0.5" width="23" height="23" rx="11.5" stroke="#D6D6D6" />
			<path d="M17 7L7 17M7 7L17 17" stroke="#131927" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>
</div>

<style>
	.gallery-item {
		/* positioning context for the corner button — must NOT clip */
		position: relative;
		aspect-ratio: 1 / 1;
	}

	/* holds/clips the photo to rounded corners; the remove button lives outside this */
	.gallery-item__media {
		width: 100%;
		height: 100%;
		border-radius: 12px;
		overflow: hidden;
		background: #d9d9d9;
	}

	.gallery-item__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.gallery-item__remove {
		position: absolute;
		/* centered on the image's top-right corner */
		top: -12px;
		right: -12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		/* revealed on hover */
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.gallery-item__remove svg {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.gallery-item:hover .gallery-item__remove,
	.gallery-item__remove:focus-visible {
		opacity: 1;
	}
</style>
