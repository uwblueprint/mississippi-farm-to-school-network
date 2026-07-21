<script lang="ts">
	import type { MapFarm } from '$lib/types/farm';
	import { getFarmProducts, getFarmTags, getTagColor } from '$lib/utils/farm-tags';

	interface Props {
		farm: MapFarm;
		farmIndex: number;
		farmCount: number;
		onBack?: () => void;
		onPrevious?: () => void;
		onNext?: () => void;
	}

	let { farm, farmIndex, farmCount, onBack, onPrevious, onNext }: Props = $props();

	let activeImageIndex = $state(0);
	let contactOpen = $state(false);

	const tags = $derived(getFarmTags(farm));
	const products = $derived(getFarmProducts(farm));
	const hasPrevious = $derived(farmIndex > 0);
	const hasNext = $derived(farmIndex < farmCount - 1);
	const hasMultipleImages = $derived(farm.imageUrls.length > 1);
	const websiteLabel = $derived(
		farm.website
			?.replace(/^https?:\/\//, '')
			.replace(/\/$/, '')
			.split('/')[0] ?? null
	);

	function showPreviousImage() {
		if (!hasMultipleImages) return;
		activeImageIndex = (activeImageIndex - 1 + farm.imageUrls.length) % farm.imageUrls.length;
	}

	function showNextImage() {
		if (!hasMultipleImages) return;
		activeImageIndex = (activeImageIndex + 1) % farm.imageUrls.length;
	}

	$effect(() => {
		const _trackedFarmId = farm.id;
		activeImageIndex = 0;
		contactOpen = false;
	});
</script>

<div class="farm-detail-panel">
	<div class="farm-detail-panel__scroll">
		<button type="button" class="farm-detail-panel__back" onclick={() => onBack?.()}>
			<span class="farm-detail-panel__chevron" aria-hidden="true">‹</span>
			Return to Farm List
		</button>

		<div class="farm-detail-panel__gallery">
			<div class="farm-detail-panel__hero-wrap">
				<img
					class="farm-detail-panel__hero"
					src={farm.imageUrls[activeImageIndex] ?? farm.thumbnailUrl}
					alt={farm.farm_name}
				/>
				{#if hasMultipleImages}
					<button
						type="button"
						class="farm-detail-panel__carousel-btn farm-detail-panel__carousel-btn--prev"
						aria-label="Previous photo"
						onclick={showPreviousImage}
					>
						<span aria-hidden="true">‹</span>
					</button>
					<button
						type="button"
						class="farm-detail-panel__carousel-btn farm-detail-panel__carousel-btn--next"
						aria-label="Next photo"
						onclick={showNextImage}
					>
						<span aria-hidden="true">›</span>
					</button>
				{/if}
			</div>
			{#if hasMultipleImages}
				<div class="farm-detail-panel__dots" role="tablist" aria-label="Farm photos">
					{#each farm.imageUrls as _, index (index)}
						<button
							type="button"
							class="farm-detail-panel__dot"
							class:farm-detail-panel__dot--active={index === activeImageIndex}
							aria-label="Photo {index + 1}"
							aria-selected={index === activeImageIndex}
							onclick={() => (activeImageIndex = index)}
						></button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="farm-detail-panel__header">
			<div class="farm-detail-panel__title-row">
				<h2 class="farm-detail-panel__title">{farm.farm_name}</h2>
				{#if farm.website}
					<a
						class="farm-detail-panel__link-btn"
						href={farm.website}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Visit {farm.farm_name} website"
					>
						<img
							class="farm-detail-panel__link-icon"
							width="20"
							height="20"
							src="/images/map/socialIcons/linkIcon.svg"
							alt=""
							aria-hidden="true"
						/>
					</a>
				{/if}
			</div>

			<div class="farm-detail-panel__tags">
				{#each tags as tag (tag)}
					<span class="farm-tag farm-tag--{getTagColor(tag)}">{tag}</span>
				{/each}
			</div>
		</div>

		<div class="farm-detail-panel__address">
			<img
				class="farm-detail-panel__pin"
				width="24"
				height="24"
				src="/images/map/socialIcons/pinIcon.svg"
				alt=""
				aria-hidden="true"
			/>
			<span class="farm-detail-panel__street">{farm.farm_address}</span>
			<span class="farm-detail-panel__county-sep" aria-hidden="true">•</span>
			<span class="farm-detail-panel__county">{farm.home_county}</span>
		</div>

		<div class="farm-detail-panel__contact">
			<button
				type="button"
				class="farm-detail-panel__contact-toggle"
				aria-expanded={contactOpen}
				onclick={() => (contactOpen = !contactOpen)}
			>
				Contact Farm
				<img
					class="farm-detail-panel__chevron-down"
					class:farm-detail-panel__chevron-down--open={contactOpen}
					width="16"
					height="16"
					src="/images/map/chevronDownIcon.svg"
					alt=""
					aria-hidden="true"
				/>
			</button>
			{#if contactOpen}
				<div class="farm-detail-panel__contact-body">
					<div class="farm-detail-panel__contact-item">
						<img
							class="farm-detail-panel__contact-icon"
							width="24"
							height="24"
							src="/images/map/socialIcons/emailIcon.svg"
							alt=""
							aria-hidden="true"
						/>
						<a href="mailto:{farm.primary_email}">{farm.primary_email}</a>
					</div>
					<div class="farm-detail-panel__contact-item">
						<img
							class="farm-detail-panel__contact-icon"
							width="24"
							height="24"
							src="/images/map/socialIcons/phoneIcon.svg"
							alt=""
							aria-hidden="true"
						/>
						<a href="tel:{farm.primary_phone}">{farm.primary_phone}</a>
					</div>
					{#if farm.website && websiteLabel}
						<div class="farm-detail-panel__contact-item">
							<img
								class="farm-detail-panel__contact-icon farm-detail-panel__contact-icon--website"
								width="28"
								height="28"
								src="/images/map/socialIcons/websiteIcon.svg"
								alt=""
								aria-hidden="true"
							/>
							<a href={farm.website} target="_blank" rel="noopener noreferrer">{websiteLabel}</a>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<section class="farm-detail-panel__products">
			<h3 class="farm-detail-panel__products-title">Products</h3>
			<ul class="farm-detail-panel__products-list">
				{#each products as product (product.section)}
					<li class="farm-detail-panel__product-row">
						<img
							class="farm-detail-panel__product-icon"
							src={product.icon}
							alt=""
							aria-hidden="true"
						/>
						<span>{product.items.join(', ')}</span>
					</li>
				{/each}
			</ul>
		</section>
	</div>

	<footer class="farm-detail-panel__footer">
		<button
			type="button"
			class="farm-detail-panel__nav"
			disabled={!hasPrevious}
			onclick={() => onPrevious?.()}
		>
			<span class="farm-detail-panel__chevron" aria-hidden="true">‹</span>
			Previous
		</button>
		<span class="farm-detail-panel__position">{farmIndex + 1} of {farmCount}</span>
		<button
			type="button"
			class="farm-detail-panel__nav"
			disabled={!hasNext}
			onclick={() => onNext?.()}
		>
			Next
			<span class="farm-detail-panel__chevron" aria-hidden="true">›</span>
		</button>
	</footer>
</div>
