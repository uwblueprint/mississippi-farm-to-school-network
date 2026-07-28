<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * "Application approved" card, shown inside a Modal on the dashboard.
	 * Carries no buttons; pass any via the `actions` snippet if an instance
	 * needs them.
	 */
	interface Props {
		title?: string;
		subtitle?: string;
		actions?: Snippet;
	}

	let {
		title = 'Your application has been approved!',
		subtitle = 'Your farm is active on the Farm Fresh Map.',
		actions
	}: Props = $props();
</script>

<div class="card">
	<span class="icon" aria-hidden="true">
		<svg width="34" height="34" viewBox="0 0 24 24" fill="none">
			<path
				d="M20 6L9 17L4 12"
				stroke="var(--mfsn-primary, #587244)"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</span>

	<h2 class="title">{title}</h2>
	<p class="subtitle">{subtitle}</p>

	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		box-sizing: border-box;
		min-width: min(560px, 100%);
		padding: 64px 48px 58px;
		background: var(--mfsn-surface, #ffffff);
		border-radius: 16px;
		box-shadow: 0 8px 30px rgba(20, 28, 16, 0.08);
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		color: var(--mfsn-text-primary, #131927);
		text-align: center;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		margin-bottom: 26px;
		border-radius: 50%;
		background: #cfe3bf;
	}

	.title {
		margin: 0;
		font-size: 28px;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}

	.subtitle {
		margin: 12px 0 0;
		font-size: 18px;
		font-weight: 400;
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: 14px;
		margin-top: 28px;
	}
</style>
