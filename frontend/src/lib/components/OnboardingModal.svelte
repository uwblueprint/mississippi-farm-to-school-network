<script lang="ts">
	interface Props {
		title: string;
		body: string;
		stepLabel: string;
		primaryLabel?: string;
		onPrimary?: () => void;
		secondaryLabel?: string;
		onSecondary?: () => void;
	}

	let { title, body, stepLabel, primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props =
		$props();

	const hasPrimary = $derived(Boolean(primaryLabel));
	const hasSecondary = $derived(Boolean(secondaryLabel));
</script>

<div class="card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
	<p class="step-counter">{stepLabel}</p>
	<h2 id="onboarding-title" class="title">{title}</h2>
	<p class="body">{body}</p>

	{#if hasPrimary || hasSecondary}
		<div
			class="actions"
			class:only-primary={hasPrimary && !hasSecondary}
			class:only-secondary={hasSecondary && !hasPrimary}
		>
			{#if hasSecondary}
				<button class="btn-secondary btn" type="button" onclick={onSecondary}
					>{secondaryLabel}</button
				>
			{/if}
			{#if hasPrimary}
				<button class="btn-primary btn" type="button" onclick={onPrimary}>{primaryLabel}</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.card {
		position: relative;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		font-size: 1rem;
		width: clamp(21em, 28vw, 40em);
		max-width: 100%;
		padding: 2em 2.25em 1.75em;
		background: var(--mfsn-surface);
		border-radius: 1em;
		box-shadow: 0 1.5em 4.375em rgba(20, 28, 16, 0.28);
		font-family: 'DM Sans', sans-serif;
	}

	.step-counter {
		margin: 0 0 0.625em;
		font-size: 1em;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.01em;
		color: var(--mfsn-text-muted);
	}

	.title {
		margin: 0 0 0.5em;
		font-size: 2.125em;
		font-weight: 500;
		line-height: 1.1;
		letter-spacing: -0.015em;
		text-wrap: balance;
		color: var(--mfsn-text-primary);
	}

	.body {
		margin: 0;
		font-size: 1.125em;
		font-weight: 400;
		line-height: 1.55;
		text-wrap: pretty;
		color: var(--mfsn-text-primary);
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.875em;
		margin-top: 1.5em;
	}

	.actions.only-primary {
		justify-content: flex-end;
	}

	.actions.only-secondary {
		justify-content: flex-start;
	}

	.btn {
		font-family: inherit;
		font-size: 1em;
		font-weight: 500;
		padding: 0.75em 1.875em;
		border: 2px solid transparent;
		border-radius: 0.75em;
		cursor: pointer;
		transition:
			background-color 150ms ease,
			color 150ms ease,
			border-color 150ms ease,
			scale 150ms ease-out;
	}

	.btn:active {
		scale: 0.96;
	}

	.btn-secondary {
		background: var(--mfsn-surface);
		color: var(--mfsn-primary);
		border-color: var(--mfsn-primary);
	}

	.btn-secondary:hover {
		background: var(--mfsn-primary-tint);
	}

	.btn-primary {
		background: var(--mfsn-primary);
		color: #ffffff;
		border-color: var(--mfsn-primary);
	}

	.btn-primary:hover {
		background: var(--mfsn-primary-hover);
		border-color: var(--mfsn-primary-hover);
	}

	@media (max-width: 32.5em) {
		.card {
			padding: 1.75em 1.5em 1.5em;
			border-radius: 0.875em;
		}

		.title {
			font-size: 1.7em;
		}

		.body {
			font-size: 1em;
		}

		.btn {
			padding: 0.6875em 1.375em;
		}
	}
</style>
