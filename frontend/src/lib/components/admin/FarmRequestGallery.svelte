<script lang="ts">
	import { resolveFarmDisplayImages } from '$lib/utils/farm-images';

	interface Props {
		farmId: string;
		farmName: string;
		coverPhoto: string | null;
		carouselPhotos: string[];
	}

	let { farmId, farmName, coverPhoto, carouselPhotos }: Props = $props();

	let photoIndex = $state(0);
	let imageUrls = $state<string[]>([]);
	let imagesLoading = $state(true);

	$effect(() => {
		const id = farmId;
		const cover = coverPhoto;
		const carousel = carouselPhotos;

		photoIndex = 0;
		imageUrls = [];
		imagesLoading = true;

		let cancelled = false;
		void resolveFarmDisplayImages({
			id,
			cover_photo: cover,
			carousel_photos: carousel
		}).then((images) => {
			if (cancelled) return;
			imageUrls = images.imageUrls;
			imagesLoading = false;
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="farm-request-modal__gallery">
	{#if imagesLoading}
		<div class="farm-modal-skeleton__photo" aria-hidden="true"></div>
		<span class="sr-only">Loading photos</span>
	{:else if imageUrls[photoIndex]}
		<img class="farm-request-modal__photo" src={imageUrls[photoIndex]} alt="Photo of {farmName}" />
	{:else}
		<p class="farm-request-modal__photo-status">No photos submitted</p>
	{/if}
	{#if imageUrls.length > 1}
		<div class="farm-request-modal__dots" role="tablist" aria-label="Photo carousel">
			{#each imageUrls as _, index (index)}
				<button
					type="button"
					role="tab"
					class="farm-request-modal__dot"
					class:farm-request-modal__dot--active={photoIndex === index}
					aria-label="Show photo {index + 1}"
					aria-selected={photoIndex === index}
					onclick={() => (photoIndex = index)}
				></button>
			{/each}
		</div>
	{/if}
</div>
