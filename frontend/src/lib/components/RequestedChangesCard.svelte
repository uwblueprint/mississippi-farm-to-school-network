<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * "Changes have been requested" card. Used standalone above the farm form
	 * and inside a Modal on the dashboard — the card carries no buttons of its
	 * own; pass them via the `actions` snippet where the instance needs them.
	 */
	interface Props {
		/** The admin's rejection reason, shown in the highlighted box. */
		reason: string;
		/** Extra line under the title (the dashboard modal uses it). */
		subtitle?: string;
		actions?: Snippet;
	}

	let { reason, subtitle, actions }: Props = $props();
</script>

<div class="card" role="alert">
	<span class="icon" aria-hidden="true">!</span>

	<h2 class="title">Changes have been requested to your application</h2>
	{#if subtitle}
		<p class="subtitle">{subtitle}</p>
	{/if}

	<hr class="divider" />

	<h3 class="heading">Requested Changes</h3>
	<p class="reason">{reason}</p>

	<p class="note">Update your farm profile and submit a new application for review</p>

	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		box-sizing: border-box;
		padding: 34px 38px 31px;
		background: var(--mfsn-surface, #ffffff);
		border-radius: 16px;
		box-shadow: 0 8px 30px rgba(20, 28, 16, 0.08);
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		color: var(--mfsn-text-primary, #131927);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-bottom: 20px;
		border-radius: 50%;
		background: #fce4e1;
		color: #c4341f;
		font-size: 24px;
		font-weight: 700;
		line-height: 1;
	}

	.title {
		margin: 0;
		font-size: 30px;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}

	.subtitle {
		margin: 14px 0 0;
		font-size: 18px;
		font-weight: 400;
	}

	.divider {
		width: 100%;
		margin: 26px 0;
		border: none;
		border-top: 1px solid #e5e7eb;
	}

	.heading {
		margin: 0 0 18px;
		font-size: 21px;
		font-weight: 500;
	}

	.reason {
		margin: 0;
		padding: 26px 30px;
		border-radius: 12px;
		background: #fcefec;
		color: #c4341f;
		font-size: 18px;
		font-weight: 400;
		line-height: 1.5;
	}

	.note {
		margin: 22px 0 0;
		font-size: 17px;
		font-weight: 400;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 14px;
		margin-top: 28px;
	}
</style>
