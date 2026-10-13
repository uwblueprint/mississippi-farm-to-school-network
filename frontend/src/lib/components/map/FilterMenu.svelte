<script lang="ts" generics="T extends string | number">
	import FilterPill from '$lib/components/FilterPill.svelte';
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

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) return;
		open = false;
		if (root?.contains(document.activeElement)) {
			root.querySelector<HTMLButtonElement>('button')?.focus();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="filter-menu" bind:this={root}>
	<FilterPill
		{label}
		active={activeCount > 0}
		badge={activeCount}
		showChevron
		chevronOpen={open}
		aria-expanded={open}
		aria-controls={menuId}
		onclick={() => (open = !open)}
	/>

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
