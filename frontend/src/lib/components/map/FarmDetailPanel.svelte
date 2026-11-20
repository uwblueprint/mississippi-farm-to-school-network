<script lang="ts">
	import { MARKER_META } from '$lib/constants/markers';
	import type { MapFarm } from '$lib/types/farm';
	import { profileUrl, toAbsoluteUrl } from '$lib/utils/external-url';
	import { getFarmProducts } from '$lib/utils/farm-tags';

	type DetailSection = {
		key: string;
		title: string | null;
		lines: string[];
	};

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

	const products = $derived(getFarmProducts(farm));
	const marker = $derived(MARKER_META[farm.markerType]);
	const detailSections = $derived(buildDetailSections(farm));
	const socialLinks = $derived(readSocialLinks(farm));
	const hasPrevious = $derived(farmIndex > 0);
	const hasNext = $derived(farmIndex < farmCount - 1);
	const hasMultipleImages = $derived(farm.imageUrls.length > 1);
	const websiteHref = $derived(toAbsoluteUrl(farm.website));
	const websiteLabel = $derived(
		websiteHref
			?.replace(/^https?:\/\//, '')
			.replace(/\/$/, '')
			.split('/')[0] ?? null
	);

	function text(value: string | null | undefined): string | null {
		const trimmed = value?.trim();
		return trimmed ? trimmed : null;
	}

	function choices(values: string[] | null | undefined, other?: string | null): string | null {
		const list = (values ?? [])
			.map((value) => value.trim())
			.filter((value) => value && value !== 'None of the above');
		if (list.length === 0) return null;
		const extra = text(other);
		return list.map((value) => (value === 'Other' && extra ? `Other: ${extra}` : value)).join(', ');
	}

	function buildDetailSections(source: MapFarm): DetailSection[] {
		const sections: DetailSection[] = [];
		const push = (key: string, title: string | null, lines: Array<string | null>) => {
			const kept = lines.filter((line): line is string => Boolean(line));
			if (kept.length > 0) sections.push({ key, title, lines: kept });
		};

		const cities = source.cities_served
			.map((city) => city.trim())
			.filter(Boolean)
			.join(', ');

		push('characteristics', 'Farm Characteristics', [choices(source.farm_characteristics)]);
		push('safety', 'Food Safety & Certifications', [
			choices(source.food_safety_certifications, source.food_safety_other)
		]);
		push('practices', 'Growing Practices', [
			choices(source.growing_practices, source.growing_practices_other)
		]);
		push('experiences', 'Farm Experiences & Services', [choices(source.farm_experiences)]);
		push('markets', 'Farmers Markets Served', [text(source.farmers_markets)]);
		push('school', 'Farm to School Sales', [choices(source.farm_to_school_sales)]);
		push('experience', 'Previous Farm to School or ECE experience', [text(source.f2s_experience)]);
		push('minimum', 'Minimum order for schools/ECEs', [text(source.minimum_order)]);
		push('delivery', 'Delivery details (area, fees, minimums)', [text(source.delivery_details)]);
		push('cities', 'Cities Served', [cities || null]);
		push('number', 'Farm Number', [text(source.usda_farm_id)]);
		return sections;
	}

	type SocialLink = { key: string; label: string; href: string; icon: string };

	const SOCIAL_ICONS = {
		instagram: '/images/map/socialIcons/instagramIcon.svg',
		facebook: '/images/map/socialIcons/facebookIcon.svg',
		x: '/images/map/socialIcons/xIcon.svg',
		tiktok: '/images/map/socialIcons/tiktokIcon.svg',
		youtube: '/images/map/socialIcons/youtubeIcon.svg',
		linkedin: '/images/map/socialIcons/linkedinIcon.svg',
		other: '/images/map/socialIcons/linkIcon.svg'
	};

	function socialLabel(value: string, withAt: boolean): string {
		const fromUrl = value.match(
			/(?:instagram|facebook|twitter|tiktok|youtube|x)\.com\/(?:@)?([^/?#]+)/i
		)?.[1];
		const bare = (fromUrl ?? value).replace(/^@/, '').replace(/\/$/, '');
		if (!bare) return value;
		if (!withAt || bare.includes(' ')) return bare;
		return `@${bare}`;
	}

	function readSocialLinks(source: MapFarm): SocialLink[] {
		const raw = source.social_media;
		if (!raw || typeof raw !== 'object') return [];
		const record = raw as Record<string, unknown>;
		const links: SocialLink[] = [];

		const instagram = text(typeof record.instagram === 'string' ? record.instagram : null);
		if (instagram) {
			links.push({
				key: 'instagram',
				label: socialLabel(instagram, true),
				href: profileUrl(
					instagram,
					'instagram.com',
					(handle) => `https://www.instagram.com/${encodeURIComponent(handle)}`
				),
				icon: SOCIAL_ICONS.instagram
			});
		}

		const facebook = text(typeof record.facebook === 'string' ? record.facebook : null);
		if (facebook) {
			links.push({
				key: 'facebook',
				label: socialLabel(facebook, false),
				href: profileUrl(
					facebook,
					'facebook.com',
					(handle) => `https://www.facebook.com/${encodeURIComponent(handle)}`
				),
				icon: SOCIAL_ICONS.facebook
			});
		}

		const other = text(typeof record.other === 'string' ? record.other : null);
		if (other) links.push(readOtherSocial(other));
		return links;
	}

	function readOtherSocial(value: string): SocialLink {
		const prefixed = value.match(
			/^(instagram|facebook|x|twitter|tiktok|youtube|linkedin)\s*[:-]\s*(.+)$/i
		);
		const body = (prefixed?.[2] ?? value).trim();
		const named = prefixed?.[1]?.toLowerCase();
		const host = body
			.replace(/^https?:\/\//, '')
			.split('/')[0]
			.replace(/^www\./, '')
			.toLowerCase();
		const kind =
			named === 'instagram' || host.includes('instagram.com')
				? 'instagram'
				: named === 'facebook' || host.includes('facebook.com')
					? 'facebook'
					: named === 'x' || named === 'twitter' || host === 'x.com' || host.includes('twitter.com')
						? 'x'
						: named === 'tiktok' || host.includes('tiktok.com')
							? 'tiktok'
							: named === 'youtube' || host.includes('youtube.com') || host === 'youtu.be'
								? 'youtube'
								: named === 'linkedin' || host.includes('linkedin.com')
									? 'linkedin'
									: 'other';
		const usesAt = kind === 'instagram' || kind === 'x' || kind === 'tiktok' || kind === 'youtube';
		const href =
			kind === 'instagram'
				? profileUrl(
						body,
						'instagram.com',
						(handle) => `https://www.instagram.com/${encodeURIComponent(handle)}`
					)
				: kind === 'facebook'
					? profileUrl(
							body,
							'facebook.com',
							(handle) => `https://www.facebook.com/${encodeURIComponent(handle)}`
						)
					: kind === 'x'
						? profileUrl(body, 'x.com', (handle) => `https://x.com/${encodeURIComponent(handle)}`)
						: kind === 'tiktok'
							? profileUrl(
									body,
									'tiktok.com',
									(handle) => `https://www.tiktok.com/@${encodeURIComponent(handle)}`
								)
							: kind === 'youtube'
								? profileUrl(
										body,
										'youtube.com',
										(handle) => `https://www.youtube.com/@${encodeURIComponent(handle)}`
									)
								: kind === 'linkedin'
									? profileUrl(
											body,
											'linkedin.com/company',
											(handle) => `https://www.linkedin.com/company/${encodeURIComponent(handle)}`
										)
									: (toAbsoluteUrl(body) ?? '');
		return {
			key: `other-${kind}`,
			label: kind === 'other' ? value : usesAt ? socialLabel(body, true) : body,
			href,
			icon: SOCIAL_ICONS[kind]
		};
	}

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
			<span class="farm-detail-panel__badge">
				<img class="farm-detail-panel__badge-icon" src={marker.icon} alt="" aria-hidden="true" />
				{marker.label}
			</span>
			<div class="farm-detail-panel__title-row">
				<h2 class="farm-detail-panel__title">{farm.farm_name}</h2>
				{#if websiteHref}
					<a
						class="farm-detail-panel__link-btn"
						href={websiteHref}
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
			{#if farm.about_us}
				<p class="farm-detail-panel__about-text">{farm.about_us}</p>
			{/if}
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
			<span class="farm-detail-panel__county">{farm.county}</span>
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
					{#if farm.primary_contact_name}
						<p class="farm-detail-panel__contact-name">{farm.primary_contact_name}</p>
					{/if}
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
					{#if websiteHref && websiteLabel}
						<div class="farm-detail-panel__contact-item">
							<img
								class="farm-detail-panel__contact-icon farm-detail-panel__contact-icon--website"
								width="28"
								height="28"
								src="/images/map/socialIcons/websiteIcon.svg"
								alt=""
								aria-hidden="true"
							/>
							<a href={websiteHref} target="_blank" rel="noopener noreferrer">{websiteLabel}</a>
						</div>
					{/if}
					{#each socialLinks as link (link.key)}
						<div class="farm-detail-panel__contact-item">
							<img
								class="farm-detail-panel__contact-icon"
								width="24"
								height="24"
								src={link.icon}
								alt=""
								aria-hidden="true"
							/>
							{#if link.href}
								<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
							{:else}
								<span>{link.label}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if products.length > 0}
			<section class="farm-detail-panel__products">
				<h3 class="farm-detail-panel__products-title">Products</h3>
				<ul class="farm-detail-panel__products-list">
					{#each products as product, index (`${product.section}-${index}`)}
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
		{/if}

		{#if detailSections.length > 0}
			<div class="farm-detail-panel__details">
				{#each detailSections as section (section.key)}
					<section class="farm-detail-panel__section">
						{#if section.title}
							<h3 class="farm-detail-panel__section-title">{section.title}</h3>
						{/if}
						{#each section.lines as line, index (index)}
							<p class="farm-detail-panel__section-text">{line}</p>
						{/each}
					</section>
				{/each}
			</div>
		{/if}
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
