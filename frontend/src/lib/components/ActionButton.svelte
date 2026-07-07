<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Reusable pill/rounded button shared across the dashboard.
	 *
	 * Extracted from the bespoke "Add farm" button so the same language is reused
	 * for Back / Save / Delete on the edit form. Renders as an <a> when `href` is
	 * provided, otherwise a <button> — mirroring the action() pattern in FarmCard.
	 *
	 * Variants are intentionally thin class hooks (.action-btn--outline, etc.) so
	 * real Figma CSS can be dropped onto each one later without touching markup.
	 */
	type Variant = 'outline' | 'primary' | 'danger';

	interface Props {
		variant?: Variant;
		/** Render as a link instead of a button. */
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		/** Stretch to fill the container width (e.g. the full-width Save). */
		block?: boolean;
		/** Leading icon (left of the label). */
		iconLeft?: Snippet;
		/** Trailing icon (right of the label). */
		iconRight?: Snippet;
		children?: Snippet;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		[name: string]: unknown;
	}

	let {
		variant = 'outline',
		href,
		type = 'button',
		disabled = false,
		block = false,
		iconLeft,
		iconRight,
		children,
		class: className = '',
		onclick,
		...rest
	}: Props = $props();

	const classes = $derived(
		[
			'action-btn',
			`action-btn--${variant}`,
			block ? 'action-btn--block' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#snippet inner()}
	{#if iconLeft}
		<span class="action-btn__icon">{@render iconLeft()}</span>
	{/if}
	{#if children}
		<span class="action-btn__label">{@render children()}</span>
	{/if}
	{#if iconRight}
		<span class="action-btn__icon">{@render iconRight()}</span>
	{/if}
{/snippet}

{#if href && !disabled}
	<a {href} class={classes} {...rest}>
		{@render inner()}
	</a>
{:else}
	<button {type} class={classes} {disabled} {onclick} {...rest}>
		{@render inner()}
	</button>
{/if}

<style>
	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		height: 47px;
		padding: 12px 18px;
		border-radius: 8px;
		box-sizing: border-box;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 16px;
		font-weight: 500;
		line-height: normal;
		text-decoration: none;
		cursor: pointer;
		border: 2px solid transparent;
		background: transparent;
	}

	.action-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.action-btn__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.action-btn--block {
		width: 100%;
	}

	/* Big full-width Save — CTA/Button 2 */
	.action-btn--primary.action-btn--block {
		font-size: 20px;
		font-weight: 600;
		line-height: 24px;
	}

	/* --- Outline (Add farm, Back) --- */
	.action-btn--outline {
		border-color: #696c78; /* --Neutral-500 */
		background: #ffffff; /* --Neutral-0 */
		color: #696c78;
	}

	/* --- Primary (Save) --- */
	.action-btn--primary {
		height: 50px;
		border-color: #587244; /* --Primary-400 */
		background: #587244;
		color: #ffffff; /* --Neutral-0 */
	}

	/* --- Danger (Delete Farm) --- */
	.action-btn--danger {
		width: 100%;
		border: none;
		background: transparent;
		color: #c4341f; /* --Secondary-600 */
		height: auto;
		padding: 0;
		text-align: center;
		font-size: 20px;
		font-weight: 300;
	}
</style>
