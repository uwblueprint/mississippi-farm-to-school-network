<script lang="ts" generics="T extends string | number">
	import FilterPill from '$lib/components/FilterPill.svelte';
	import { toggleSelection, type FilterOption } from '$lib/utils/farm-filters';

	interface Props {
		label: string;
		options: FilterOption<T>[];
		selected?: T[];
		multiple?: boolean;
		note?: string;
		variant?: 'dropdown' | 'sheet';
		title?: string;
		showBadge?: boolean;
	}

	let {
		label,
		options,
		selected = $bindable([]),
		multiple = true,
		note,
		variant = 'dropdown',
		title = label,
		showBadge = true
	}: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);
	let dialog = $state<HTMLDialogElement | null>(null);

	const menuId = `filter-menu-${Math.random().toString(36).slice(2, 9)}`;
	const activeCount = $derived(selected.length);

	function toggleOption(value: T) {
		selected = toggleSelection(selected, value, multiple);
	}

	function clear() {
		selected = [];
	}

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) open = false;
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
		badge={showBadge ? activeCount : 0}
		showChevron
		chevronOpen={open}
		aria-expanded={open}
		aria-controls={menuId}
		aria-haspopup={variant === 'sheet' ? 'dialog' : undefined}
		onclick={() => (open = !open)}
	/>

	{#if variant === 'sheet'}
		<dialog
			bind:this={dialog}
			id={menuId}
			class="filter-menu__sheet"
			aria-labelledby="{menuId}-title"
			onclose={() => (open = false)}
			onclick={handleBackdropClick}
		>
			<div class="filter-menu__sheet-inner">
				<header class="filter-menu__sheet-header">
					<h2 id="{menuId}-title" class="filter-menu__sheet-title">{title}</h2>
					<button type="button" class="filter-menu__done" onclick={() => (open = false)}>
						Done
					</button>
				</header>

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

				<button
					type="button"
					class="filter-menu__clear"
					class:filter-menu__clear--hidden={activeCount === 0}
					onclick={clear}
				>
					Clear
				</button>
			</div>
		</dialog>
	{:else if open}
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

	.filter-menu__clear--hidden {
		visibility: hidden;
	}

	.filter-menu__sheet {
		width: 100%;
		max-width: 100%;
		max-height: 80dvh;
		margin: auto 0 0;
		padding: 0;
		border: none;
		border-radius: 1rem 1rem 0 0;
		background: #fff;
		box-shadow: 0 -2px 12px rgba(19, 25, 39, 0.15);
		overscroll-behavior: contain;
	}

	.filter-menu__sheet::backdrop {
		background: rgba(19, 25, 39, 0.4);
	}

	.filter-menu__sheet-inner {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
	}

	.filter-menu__sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.filter-menu__sheet-title {
		margin: 0;
		font-family: 'Figtree', 'DM Sans', sans-serif;
		font-size: 1.25rem;
		font-weight: 500;
		color: #111;
	}

	.filter-menu__done {
		min-height: 2.75rem;
		padding: 0 0.5rem;
		border: none;
		background: none;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 600;
		color: #587244;
		cursor: pointer;
	}

	.filter-menu__sheet .filter-menu__note {
		margin-bottom: 0.5rem;
		padding: 0.625rem 0.75rem;
		font-size: 0.875rem;
		line-height: 1.35;
	}

	.filter-menu__sheet .filter-menu__option {
		gap: 0.875rem;
		min-height: 3rem;
		padding: 0 0.25rem;
		border-radius: 0;
		border-bottom: 1px solid #f0f0f0;
		font-size: 1rem;
	}

	.filter-menu__sheet .filter-menu__option:hover {
		background: none;
	}

	.filter-menu__sheet .filter-menu__option input {
		width: 1.25rem;
		height: 1.25rem;
	}

	.filter-menu__sheet .filter-menu__clear {
		align-self: flex-start;
		min-height: 2.75rem;
		padding: 0 0.25rem;
		font-size: 0.9375rem;
	}
</style>
