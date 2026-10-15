<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * "Deletion request approved" card, shown inside a Modal on the farmer
	 * dashboard. Mirrors RequestedChangesCard's layout; pass buttons via
	 * the `actions` snippet.
	 */
	interface Props {
		farmName: string;
		actions?: Snippet;
	}

	let { farmName, actions }: Props = $props();
</script>

<div class="card" role="status">
	<span class="icon" aria-hidden="true">
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
			<path
				d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</span>

	<h2 class="title">Your deletion request has been approved</h2>
	<p class="subtitle">We've reviewed your request to delete your farm</p>

	<hr class="divider" />

	<h3 class="heading">Deleted Farm</h3>
	<p class="farm">{farmName}</p>

	<p class="note">
		It has been removed from your dashboard and the Farm Fresh Map. Contact MFSN if this was a
		mistake.
	</p>

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
		background: #eceef2;
		color: #4f545e;
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

	.farm {
		margin: 0;
		padding: 26px 30px;
		border-radius: 12px;
		background: #f5f6f8;
		color: #4f545e;
		font-size: 18px;
		font-weight: 500;
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
