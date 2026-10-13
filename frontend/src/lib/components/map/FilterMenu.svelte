<script lang="ts" generics="T extends string | number">
	import type { FilterOption } from '$lib/utils/farm-filters';

	interface Props {
		label: string;
		options: FilterOption<T>[];
		selected?: T[];
		multiple?: boolean;
		note?: string;
	}

	let { label, options, selected = $bindable([]), multiple = true, note }: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);

	const menuId = `filter-menu-${Math.random().toString(36).slice(2, 9)}`;
	const activeCount = $derived(selected.length);

	function toggleOption(value: T) {
		if (multiple) {
			selected = selected.includes(value)
				? selected.filter((item) => item !== value)
				: [...selected, value];
		} else {
			selected = selected.includes(value) ? [] : [value];
		}
	}

	function clear() {
		selected = [];
	}

	function handleWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) {
			open = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			open = false;
			root?.querySelector<HTMLButtonElement>('.filter-menu__trigger')?.focus();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="filter-menu" bind:this={root} onkeydown={handleKeydown}>
	<button
		type="button"
		class="filter-menu__trigger"
		class:filter-menu__trigger--active={activeCount > 0}
		aria-expanded={open}
		aria-controls={menuId}
		onclick={() => (open = !open)}
	>
		<span>{label}</span>
		{#if activeCount > 0}
			<span class="filter-menu__count" aria-label="{activeCount} selected">{activeCount}</span>
		{/if}
		<span class="filter-menu__chevron" class:filter-menu__chevron--open={open} aria-hidden="true"
			>›</span
		>
	</button>

	{#if open}
		<fieldset id={menuId} class="filter-menu__panel">
			<legend class="filter-menu__legend">{label}</legend>

			{#if note}
				<p class="filter-menu__note">{note}</p>
			{/if}

			{#each options as option (option.value)}
				<label class="filter-menu__option">
					<input
						type={multiple ? 'checkbox' : 'radio'}
						name={menuId}
						checked={selected.includes(option.value)}
						onclick={() => toggleOption(option.value)}
					/>
					<span>{option.label}</span>
				</label>
			{/each}

			{#if activeCount > 0}
				<button type="button" class="filter-menu__clear" onclick={clear}>Clear</button>
			{/if}
		</fieldset>
	{/if}
</div>

<style>
	.filter-menu {
		position: relative;
	}

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

	.filter-menu__trigger:hover {
		background: #f9fafb;
	}

	.filter-menu__trigger--active {
		border: 1.5px solid #93a883;
		font-weight: 600;
		color: #455d32;
	}

	.filter-menu__count {
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

	.filter-menu__chevron {
		display: inline-block;
		transform: rotate(90deg);
		font-size: 0.85rem;
		line-height: 1;
		transition: transform 0.15s ease;
	}

	.filter-menu__chevron--open {
		transform: rotate(-90deg);
	}

	.filter-menu__panel {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 16rem;
		max-width: calc(100vw - 2rem);
		margin: 0;
		padding: 0.5rem;
		border: 1px solid var(--color-neutral-300, #d3d5de);
		border-radius: 0.5rem;
		background: var(--color-neutral-0, #ffffff);
		box-shadow: 0 8px 20px rgba(19, 25, 39, 0.12);
	}

	.filter-menu__legend {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.filter-menu__note {
		margin: 0 0 0.25rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fdf8ec;
		font-size: 0.8125rem;
		line-height: 1.3;
		color: #6b5a2e;
	}

	.filter-menu__option {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-text-primary, #131927);
		cursor: pointer;
	}

	.filter-menu__option:hover {
		background: var(--color-neutral-100, #fafafa);
	}

	.filter-menu__option input {
		width: 1rem;
		height: 1rem;
		margin: 0;
		accent-color: #587244;
		cursor: pointer;
	}

	.filter-menu__clear {
		align-self: flex-end;
		margin-top: 0.25rem;
		padding: 0.375rem 0.75rem;
		border: none;
		background: none;
		font-family: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #587244;
		text-decoration: underline;
		cursor: pointer;
	}
</style>
