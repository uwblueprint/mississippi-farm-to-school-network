<script lang="ts">
	import type { FilterOption } from '$lib/utils/farm-filters';

	interface Props {
		label: string;
		options: FilterOption[];
		/** Two-way bound selections. Single-select pills hold at most one value. */
		selected?: string[];
		/** false makes the pill behave as single-select (used by Distance). */
		multiple?: boolean;
		ariaLabel: string;
		/** Disables the trigger, e.g. Distance without a known user location. */
		disabled?: boolean;
		/** Shown inside the menu when the pill is otherwise unusable. */
		hint?: string;
	}

	let {
		label,
		options,
		selected = $bindable([]),
		multiple = true,
		ariaLabel,
		disabled = false,
		hint
	}: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);

	const activeCount = $derived(selected.length);

	function toggleOpen(event: MouseEvent) {
		event.stopPropagation();
		if (disabled) return;
		open = !open;
	}

	function toggleOption(value: string, event: MouseEvent) {
		event.stopPropagation();

		if (multiple) {
			selected = selected.includes(value)
				? selected.filter((item) => item !== value)
				: [...selected, value];
			return;
		}

		// Single-select: re-picking the active option clears it.
		selected = selected.includes(value) ? [] : [value];
		open = false;
	}

	function clearGroup(event: MouseEvent) {
		event.stopPropagation();
		selected = [];
	}

	function handleWindowClick(event: MouseEvent) {
		if (!open || !root) return;
		if (!root.contains(event.target as Node)) open = false;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) open = false;
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="filter-menu" bind:this={root}>
	<button
		type="button"
		class="filter-menu__trigger"
		class:filter-menu__trigger--active={activeCount > 0}
		aria-expanded={open}
		aria-haspopup="true"
		{disabled}
		onclick={toggleOpen}
	>
		{#if activeCount > 0}
			<span class="filter-menu__count">{activeCount}</span>
		{/if}
		<span class="filter-menu__label">{label}</span>
		<img
			class="filter-menu__chevron"
			class:filter-menu__chevron--open={open}
			src="/images/map/chevronDownIcon.svg"
			alt=""
		/>
	</button>

	{#if open}
		<div class="filter-menu__panel" role="group" aria-label={ariaLabel}>
			{#if hint}
				<p class="filter-menu__hint">{hint}</p>
			{/if}

			<ul class="filter-menu__list">
				{#each options as option (option.value)}
					{@const checked = selected.includes(option.value)}
					<li>
						<button
							type="button"
							class="filter-menu__option"
							role={multiple ? 'checkbox' : 'radio'}
							aria-checked={checked}
							onclick={(event) => toggleOption(option.value, event)}
						>
							<span class="filter-menu__box" class:filter-menu__box--checked={checked}>
								{#if checked}<span class="filter-menu__tick" aria-hidden="true">✓</span>{/if}
							</span>
							<span>{option.label}</span>
						</button>
					</li>
				{/each}
			</ul>

			{#if activeCount > 0}
				<button type="button" class="filter-menu__clear" onclick={clearGroup}>
					Clear {label.toLowerCase()}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.filter-menu {
		position: relative;
		flex-shrink: 0;
	}

	/* Matches the shared FilterPills trigger so the row reads as one control set. */
	.filter-menu__trigger {
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

	.filter-menu__trigger:hover:not(:disabled) {
		background: #f9fafb;
	}

	.filter-menu__trigger:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.filter-menu__trigger--active {
		border: 1.5px solid #93a883;
		color: #455d32;
	}

	.filter-menu__trigger--active .filter-menu__label {
		font-weight: 600;
	}

	.filter-menu__count {
		font-weight: 800;
	}

	.filter-menu__chevron {
		width: 0.875rem;
		height: 0.875rem;
		transition: transform 0.15s ease;
	}

	.filter-menu__chevron--open {
		transform: rotate(180deg);
	}

	.filter-menu__panel {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		z-index: 15;
		min-width: 14rem;
		max-height: 18rem;
		overflow-y: auto;
		padding: 0.375rem;
		border: 1px solid var(--color-neutral-300, #d3d5de);
		border-radius: 0.5rem;
		background: var(--color-neutral-0, #ffffff);
		box-shadow: 0 8px 20px rgba(19, 25, 39, 0.12);
	}

	.filter-menu__hint {
		margin: 0.25rem 0.5rem 0.5rem;
		color: #858790;
		font-size: 0.75rem;
		line-height: 1.35;
	}

	.filter-menu__list {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.filter-menu__option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: none;
		font-family: inherit;
		font-size: 0.875rem;
		text-align: left;
		color: var(--color-text-primary, #131927);
		cursor: pointer;
	}

	.filter-menu__option:hover {
		background: var(--color-neutral-100, #fafafa);
	}

	.filter-menu__box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1rem;
		height: 1rem;
		border: 1.5px solid #d3d5de;
		border-radius: 0.25rem;
		background: #ffffff;
	}

	.filter-menu__box--checked {
		border-color: #587244;
		background: #587244;
		color: #ffffff;
	}

	.filter-menu__tick {
		font-size: 0.7rem;
		line-height: 1;
	}

	.filter-menu__clear {
		width: 100%;
		margin-top: 0.25rem;
		padding: 0.5rem;
		border: none;
		border-top: 1px solid #f5f6f8;
		background: none;
		font-family: inherit;
		font-size: 0.8125rem;
		color: #587244;
		text-align: left;
		cursor: pointer;
	}

	.filter-menu__clear:hover {
		text-decoration: underline;
	}
</style>
