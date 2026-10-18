<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'type' | 'class'> {
		label: string;
		active?: boolean;
		count?: number;
		badge?: number;
		showChevron?: boolean;
		chevronOpen?: boolean;
	}

	let {
		label,
		active = false,
		count,
		badge,
		showChevron = false,
		chevronOpen = false,
		...rest
	}: Props = $props();
</script>

<button type="button" class="filter-pill" class:filter-pill--active={active} {...rest}>
	{#if count !== undefined}
		<span class="filter-pill__count">{count}</span>
	{/if}
	<span class="filter-pill__label">{label}</span>
	{#if badge}
		<span class="filter-pill__badge" aria-label="{badge} selected">{badge}</span>
	{/if}
	{#if showChevron}
		<span
			class="filter-pill__chevron"
			class:filter-pill__chevron--open={chevronOpen}
			aria-hidden="true">›</span
		>
	{/if}
</button>

<style>
	.filter-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		height: 2.125rem;
		padding: 0.3125rem 0.75rem;
		border: 1px solid var(--color-neutral-300, #d3d5de);
		border-radius: 1rem;
		background: var(--color-neutral-0, #ffffff);
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1rem;
		color: var(--color-text-secondary, #4f545e);
		white-space: nowrap;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.filter-pill:hover {
		background: #f9fafb;
	}

	.filter-pill__count {
		font-weight: 600;
	}

	.filter-pill--active {
		border: 1.5px solid #93a883;
		color: #455d32;
	}

	.filter-pill--active .filter-pill__count {
		font-weight: 800;
	}

	.filter-pill--active .filter-pill__label {
		font-weight: 600;
	}

	.filter-pill__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.3rem;
		border-radius: 0.5625rem;
		background: #587244;
		font-size: 0.6875rem;
		font-weight: 700;
		color: #fff;
	}

	.filter-pill__chevron {
		display: inline-block;
		transform: rotate(90deg);
		font-size: 0.85rem;
		line-height: 1;
		transition: transform 0.15s ease;
	}

	.filter-pill__chevron--open {
		transform: rotate(-90deg);
	}
</style>
