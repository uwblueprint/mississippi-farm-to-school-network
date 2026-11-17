<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * "Application pending" card, shown inside a Modal when a farmer taps a farm
	 * that is still awaiting admin review. Same shell as ApprovedCard.
	 */
	interface Props {
		title?: string;
		subtitle?: string;
		actions?: Snippet;
	}

	let {
		title = 'Your application is pending approval.',
		subtitle = 'Applications are typically reviewed within 1-2 weeks. We will notify you once your application has been reviewed.',
		actions
	}: Props = $props();
</script>

<div class="card">
	<span class="icon" aria-hidden="true">
		<!-- lucide "clock" -->
		<svg width="34" height="34" viewBox="0 0 24 24" fill="none">
			<circle cx="12" cy="12" r="9" stroke="#B26B12" stroke-width="2.25" />
			<path
				d="M12 7V12L15 14"
				stroke="#B26B12"
				stroke-width="2.25"
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
		width: 560px;
		max-width: 100%;
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
		background: #fdf1dd; /* the Pending badge's background (farmStatus.ts) */
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
		color: #4f545e;
		font-size: 18px;
		font-weight: 400;
		line-height: 1.45;
		text-wrap: pretty;
	}

	@media (max-width: 767px) {
		.card {
			/* the Modal's 44px close button sits in the top-right corner */
			padding: 56px 24px 40px;
			border-radius: 12px;
		}

		.icon {
			width: 56px;
			height: 56px;
			margin-bottom: 20px;
		}

		.title {
			font-size: 22px;
		}

		.subtitle {
			font-size: 16px;
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 14px;
		margin-top: 28px;
	}
</style>
