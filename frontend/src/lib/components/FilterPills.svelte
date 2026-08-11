<script lang="ts" module>
	export type FilterPillItem = {
		value: string;
		label: string;
		/** Shown as a badge before the label (e.g. admin's per-filter result counts). */
		count?: number;
	};
</script>

<script lang="ts">
	interface Props {
		items: FilterPillItem[];
		/** Two-way bound active value. Only meaningful when `selectable` is true. */
		selected?: string;
		/**
		 * Whether clicking a pill marks it "active" and updates `selected`.
		 * Set to false for pills that just trigger an action (e.g. opening a
		 * filter menu) instead of representing a persistent choice.
		 */
		selectable?: boolean;
		onSelect?: (value: string) => void;
		/** Optional leading text before the pill group, e.g. "Filters". */
		groupLabel?: string;
		ariaLabel: string;
		/** Trailing chevron, used for pills that open a submenu. */
		showChevron?: boolean;
	}

	let {
		items,
		selected = $bindable(undefined),
		selectable = true,
		onSelect,
		groupLabel,
		ariaLabel,
		showChevron = false
	}: Props = $props();

	function handleClick(value: string) {
		if (selectable) selected = value;
		onSelect?.(value);
	}
</script>

{#snippet pillButtons()}
	{#each items as item (item.value)}
		<button
			type="button"
			class="filter-pill"
			class:filter-pill--active={selectable && selected === item.value}
			aria-pressed={selectable ? selected === item.value : undefined}
			onclick={() => handleClick(item.value)}
		>
			{#if item.count !== undefined}
				<span class="filter-pill__count">{item.count}</span>
			{/if}
			<span class="filter-pill__label">{item.label}</span>
			{#if showChevron}
				<span class="filter-pill__chevron" aria-hidden="true">›</span>
			{/if}
		</button>
	{/each}
{/snippet}

{#if groupLabel}
	<div class="filter-pill-row" aria-label={ariaLabel}>
		<span class="filter-pill-row__label">{groupLabel}</span>
		<div class="filter-pill-group">
			{@render pillButtons()}
		</div>
	</div>
{:else}
	<div class="filter-pill-group" role="group" aria-label={ariaLabel}>
		{@render pillButtons()}
	</div>
{/if}

<style>
	.filter-pill-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.filter-pill-row__label {
		font-size: 1rem;
		color: #9ea0ad;
		white-space: nowrap;
	}

	.filter-pill-group {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

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

	.filter-pill__chevron {
		display: inline-block;
		transform: rotate(90deg);
		font-size: 0.85rem;
		line-height: 1;
	}
</style>
