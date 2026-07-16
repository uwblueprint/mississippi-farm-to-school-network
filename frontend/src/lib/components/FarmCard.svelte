<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FARM_STATUS_STYLES, type FarmStatus } from '$lib/farmStatus';

	interface Props {
		/** Farm id (used by callers to build hrefs / mutation targets). */
		id?: string;
		/**
		 * Farm image source (e.g. a signed URL from getFile()). When absent/null
		 * the card shows an empty grey block instead.
		 */
		imageUrl?: string | null;
		/** Accessibility label for the image. */
		imageAlt?: string;
		/** Title line (farm name). */
		title?: string;
		/** Primary subtitle line (address). */
		subtitle?: string;
		/** Secondary subtitle line (owner / county). */
		subtitle2?: string;
		/** Farm status; drives the badge label + colors. Badge hidden when omitted. */
		status?: FarmStatus;
		/** When set, the whole card becomes a link to this href (e.g. the edit page). */
		href?: string;
		/** Extra classes passed through to the card shell. */
		class?: string;
		/** Additional content rendered in the body. */
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		id,
		imageUrl,
		imageAlt = '',
		title = '',
		subtitle = '',
		subtitle2 = '',
		status,
		href,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const statusStyle = $derived(status ? FARM_STATUS_STYLES[status] : undefined);
</script>

<!-- The action buttons were removed from the design; when `href` is provided the
     whole card is the click target (link), otherwise it renders as a plain div. -->
<svelte:element
	this={href ? 'a' : 'div'}
	class="farm-card {className}"
	data-farm-id={id}
	href={href || undefined}
	{...rest}
>
	{#if statusStyle}
		<div
			class="farm-card__status"
			style="background:{statusStyle.background}; color:{statusStyle.color}"
		>
			{statusStyle.label}
		</div>
	{/if}
	{#if imageUrl}
		<div
			class="farm-card__image"
			role="img"
			aria-label={imageAlt}
			style="background-image: url('{imageUrl}')"
		></div>
	{:else}
		<!-- Farm has no uploaded image: plain grey block, not announced to AT. -->
		<div class="farm-card__image" aria-hidden="true"></div>
	{/if}
	<div class="farm-card__body">
		<div class="farm-card__text">
			{#if title}<span class="farm-card__title">{title}</span>{/if}
			{#if subtitle}<span class="farm-card__subtitle">{subtitle}</span>{/if}
			{#if subtitle2}<span class="farm-card__subtitle farm-card__subtitle--muted">{subtitle2}</span>{/if}
		</div>
		{@render children?.()}
	</div>
</svelte:element>

<style>
	.farm-card {
		position: relative;
		width: 100%;
		max-width: 486px;
		border-radius: 11.535px;
		border: 1.922px solid #d9d9d9;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background: #fff;
		/* link reset so the card's own text colors win when rendered as an <a> */
		color: inherit;
		text-decoration: none;
	}

	/* Hover affordance only when the card is an actual link. */
	a.farm-card {
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	a.farm-card:hover {
		border-color: #b9b9b9;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
	}

	.farm-card__status {
		position: absolute;
		top: 20px;
		right: 20px; /* anchored right, so it grows leftward as content widens */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		border-radius: 999px;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 16px;
		font-weight: 500;
		line-height: normal;
		white-space: nowrap;
		/* background + color set inline per status (see farmStatus.ts) */
	}

	.farm-card__image {
		width: 100%;
		aspect-ratio: 482 / 225; /* keeps the ~60% image proportion as the card scales */
		border-bottom: 1.922px solid #d9d9d9; /* divider matching the outer card border */
		border-bottom-left-radius: 11.535px;
		border-bottom-right-radius: 11.535px;
		background-color: #e6e6e6; /* empty state, and fallback while an image loads */
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
	}

	.farm-card__body {
		flex-shrink: 0; /* keep natural content height so paddings stay exact */
		/* was 8px 16px 20px with an actions row below; without it, a touch more
		   bottom padding balances the card so the text isn't crammed at the edge */
		padding: 14px 16px 18px;
		display: flex;
		flex-direction: column;
	}

	.farm-card__text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 7.7px;
		min-width: 0;
	}

	.farm-card__title {
		width: 100%;
		color: #000;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 23.069px;
		font-style: normal;
		font-weight: 400;
		line-height: 32.681px;
		/* keep titles to one line so cards in a row stay the same height */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.farm-card__subtitle {
		width: 100%;
		color: #61636d;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		font-style: normal;
		font-weight: 500;
		line-height: 16px;
		/* one line + ellipsis so every card in a row is the same height */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.farm-card__subtitle--muted {
		color: #858790;
	}
</style>
