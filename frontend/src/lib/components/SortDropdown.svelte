<script lang="ts" module>
	export type SortDropdownItem = {
		value: string;
		label: string;
	};
</script>

<script lang="ts">
	interface Props {
		items: SortDropdownItem[];
		/** Two-way bound selected value. Null means no option chosen yet. */
		selected?: string | null;
		/** Static trigger text when nothing is selected, or when `showSelectedLabel` is false. */
		triggerLabel?: string;
		/**
		 * When true, the trigger shows the selected option's label (map).
		 * When false, the trigger always shows `triggerLabel` (admin).
		 */
		showSelectedLabel?: boolean;
		ariaLabel: string;
	}

	let {
		items,
		selected = $bindable(null),
		triggerLabel = 'Sort by',
		showSelectedLabel = false,
		ariaLabel
	}: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);

	const displayLabel = $derived(
		showSelectedLabel && selected
			? (items.find((item) => item.value === selected)?.label ?? triggerLabel)
			: triggerLabel
	);

	function toggle(event: MouseEvent) {
		event.stopPropagation();
		open = !open;
	}

	function select(value: string, event: MouseEvent) {
		event.stopPropagation();
		selected = value;
		open = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!open || !root) return;
		if (!root.contains(event.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="sort-dropdown" bind:this={root}>
	<button
		type="button"
		class="sort-dropdown__trigger"
		class:sort-dropdown__trigger--selected={showSelectedLabel && selected != null}
		aria-expanded={open}
		aria-haspopup="listbox"
		onclick={toggle}
	>
		<span class="sort-dropdown__label">{displayLabel}</span>
		<img
			class="sort-dropdown__chevron"
			class:sort-dropdown__chevron--open={open}
			src="/images/map/chevronDownIcon.svg"
			alt=""
		/>
	</button>

	{#if open}
		<ul class="sort-dropdown__menu" role="listbox" aria-label={ariaLabel}>
			{#each items as option (option.value)}
				<li role="presentation">
					<button
						type="button"
						class="sort-dropdown__option"
						class:sort-dropdown__option--selected={selected === option.value}
						role="option"
						aria-selected={selected === option.value}
						onclick={(event) => select(option.value, event)}
					>
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sort-dropdown {
		position: relative;
		flex-shrink: 0;
	}

	.sort-dropdown__trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: none;
		background: none;
		padding: 0;
		font-family: inherit;
		cursor: pointer;
	}

	.sort-dropdown__label {
		font-size: 1rem;
		font-weight: 500;
		line-height: 1.5rem;
		color: var(--color-text-primary, #131927);
		white-space: nowrap;
	}

	.sort-dropdown__trigger--selected .sort-dropdown__label {
		color: #587244;
	}

	.sort-dropdown__chevron {
		width: 1rem;
		height: 1rem;
		transition: transform 0.15s ease;
	}

	.sort-dropdown__chevron--open {
		transform: rotate(180deg);
	}

	.sort-dropdown__menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		min-width: 12rem;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		border: 1px solid var(--color-neutral-300, #d3d5de);
		border-radius: 0.5rem;
		background: var(--color-neutral-0, #ffffff);
		box-shadow: 0 8px 20px rgba(19, 25, 39, 0.12);
	}

	.sort-dropdown__option {
		display: block;
		width: 100%;
		border: none;
		background: none;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-family: inherit;
		font-size: 0.875rem;
		text-align: left;
		color: var(--color-text-primary, #131927);
		cursor: pointer;
	}

	.sort-dropdown__option:hover {
		background: var(--color-neutral-100, #fafafa);
	}

	.sort-dropdown__option--selected {
		font-weight: 600;
		color: #455d32;
		background: #f4f7f1;
	}
</style>
