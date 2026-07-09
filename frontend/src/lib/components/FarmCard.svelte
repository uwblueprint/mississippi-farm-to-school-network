<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FARM_STATUS_STYLES, type FarmStatus } from '$lib/farmStatus';

	interface Props {
		/** Farm id (used by callers to build hrefs / mutation targets). */
		id?: string;
		/** Farm image source (e.g. a Firebase signed URL from getFile()). */
		imageUrl: string;
		/** Accessibility label for the image. */
		imageAlt?: string;
		/** Title line (farm name). */
		title?: string;
		/** Primary subtitle line (address). */
		subtitle?: string;
		/** Secondary subtitle line (owner). */
		subtitle2?: string;
		/** Farm status; drives the badge label + colors. Badge hidden when omitted. */
		status?: FarmStatus;
		/** Edit button: provide an href to route, or onEdit to handle a click. */
		editHref?: string;
		onEdit?: () => void;
		/** Archive button: href to route, or onArchive to trigger a mutation. */
		archiveHref?: string;
		onArchive?: () => void;
		/** View button: href to route, or onView to handle a click. */
		viewHref?: string;
		onView?: () => void;
		/** Extra classes passed through to the card shell. */
		class?: string;
		/** Additional content rendered below the actions in the body. */
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
		editHref,
		onEdit,
		archiveHref,
		onArchive,
		viewHref,
		onView,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const statusStyle = $derived(status ? FARM_STATUS_STYLES[status] : undefined);
</script>

<!-- Icons (Untitled UI: edit-05 / archive / eye) -->
{#snippet editIcon()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M11 4H6.8c-1.68 0-2.52 0-3.16.33a3 3 0 0 0-1.31 1.3C2 6.29 2 7.13 2 8.8v8.4c0 1.68 0 2.52.33 3.16a3 3 0 0 0 1.31 1.31C4.28 22 5.12 22 6.8 22h8.4c1.68 0 2.52 0 3.16-.33a3 3 0 0 0 1.3-1.31c.34-.64.34-1.48.34-3.16V13" />
		<path d="M16.04 3.02a2.08 2.08 0 1 1 2.94 2.94L12.16 12.8c-.4.4-.6.6-.83.74-.2.13-.42.23-.65.3-.25.08-.52.1-1.07.16l-2.2.24.24-2.2c.06-.55.08-.82.16-1.07.07-.23.17-.45.3-.65.14-.23.34-.43.74-.83l6.85-6.82Z" />
	</svg>
{/snippet}
{#snippet archiveIcon()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M21 8v8.2c0 1.68 0 2.52-.33 3.16a3 3 0 0 1-1.31 1.31c-.64.33-1.48.33-3.16.33H7.8c-1.68 0-2.52 0-3.16-.33a3 3 0 0 1-1.31-1.31C3 18.72 3 17.88 3 16.2V8" />
		<path d="M2 5.2c0-.84 0-1.26.16-1.58a1.5 1.5 0 0 1 .66-.66C3.14 2.8 3.56 2.8 4.4 2.8h15.2c.84 0 1.26 0 1.58.16a1.5 1.5 0 0 1 .66.66c.16.32.16.74.16 1.58s0 1.26-.16 1.58a1.5 1.5 0 0 1-.66.66C20.86 8 20.44 8 19.6 8H4.4c-.84 0-1.26 0-1.58-.16a1.5 1.5 0 0 1-.66-.66C2 6.86 2 6.44 2 5.6v-.4Z" />
		<path d="M10 12h4" />
	</svg>
{/snippet}
{#snippet viewIcon()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M2.42 12.71c-.14-.22-.2-.33-.24-.5a1.2 1.2 0 0 1 0-.42c.04-.17.1-.28.24-.5C3.55 8.97 6.91 4.5 12 4.5s8.45 4.47 9.58 6.29c.14.22.2.33.24.5.03.13.03.29 0 .42-.04.17-.1.28-.24.5C20.45 15.03 17.09 19.5 12 19.5s-8.45-4.47-9.58-6.29Z" />
		<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
	</svg>
{/snippet}

<!-- Renders an action as a link (href) or a button (onclick); disabled when neither is given -->
{#snippet action(label: string, icon: Snippet, href?: string, onclick?: () => void)}
	{#if href}
		<a class="farm-card__btn" {href} aria-label={label}>{@render icon()}</a>
	{:else}
		<button class="farm-card__btn" type="button" aria-label={label} {onclick} disabled={!onclick}>
			{@render icon()}
		</button>
	{/if}
{/snippet}

<div class="farm-card {className}" data-farm-id={id} {...rest}>
	{#if statusStyle}
		<div
			class="farm-card__status"
			style="background:{statusStyle.background}; color:{statusStyle.color}"
		>
			{statusStyle.label}
		</div>
	{/if}
	<div
		class="farm-card__image"
		role="img"
		aria-label={imageAlt}
		style="background-image: url('{imageUrl}')"
	></div>
	<div class="farm-card__body">
		<div class="farm-card__text">
			{#if title}<span class="farm-card__title">{title}</span>{/if}
			{#if subtitle}<span class="farm-card__subtitle">{subtitle}</span>{/if}
			{#if subtitle2}<span class="farm-card__subtitle farm-card__subtitle--muted">{subtitle2}</span>{/if}
		</div>
		<div class="farm-card__actions">
			<div class="farm-card__actions-group">
				{@render action('Edit', editIcon, editHref, onEdit)}
				{@render action('Archive', archiveIcon, archiveHref, onArchive)}
			</div>
			<div class="farm-card__actions-group">
				{@render action('View', viewIcon, viewHref, onView)}
			</div>
		</div>
		{@render children?.()}
	</div>
</div>

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
		background-color: lightgray; /* fallback while image loads */
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
	}

	.farm-card__body {
		flex-shrink: 0; /* keep natural content height so paddings stay exact */
		padding: 8px 16px 20px;
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

	.farm-card__actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 15px;
	}

	.farm-card__actions-group {
		display: flex;
		align-items: center;
		gap: 17px;
	}

	.farm-card__btn {
		display: flex;
		width: 33px;
		height: 33px;
		padding: 8.444px 12.667px;
		justify-content: center;
		align-items: center;
		gap: 2.815px;
		border-radius: 5.63px;
		background: #587244;
		border: none;
		box-sizing: border-box;
		color: #ffffff;
		text-decoration: none;
		cursor: pointer;
	}

	.farm-card__btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.farm-card__btn svg {
		width: 18px;
		height: 18px;
		flex: none;
	}
</style>
