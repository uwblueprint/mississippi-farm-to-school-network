<script lang="ts" module>
	export type FilterPillItem = {
		value: string;
		label: string;
		/** Shown as a badge before the label (e.g. admin's per-filter result counts). */
		count?: number;
	};
</script>

<script lang="ts">
	import FilterPill from '$lib/components/FilterPill.svelte';

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
		<FilterPill
			label={item.label}
			count={item.count}
			active={selectable && selected === item.value}
			{showChevron}
			aria-pressed={selectable ? selected === item.value : undefined}
			onclick={() => handleClick(item.value)}
		/>
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
</style>
