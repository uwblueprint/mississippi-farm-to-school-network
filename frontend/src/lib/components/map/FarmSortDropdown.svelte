<script lang="ts">
	const SORT_OPTIONS = [
		{ value: 'distance', label: 'Distance' },
		{ value: 'name-asc', label: 'Name (A–Z)' },
		{ value: 'name-desc', label: 'Name (Z–A)' }
	] as const;

	let sortBy = $state<(typeof SORT_OPTIONS)[number]['value'] | null>(null);
	let open = $state(false);

	let root = $state<HTMLDivElement | null>(null);

	const selectedLabel = $derived(
		sortBy ? (SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Sort by') : 'Sort by'
	);

	function toggle(event: MouseEvent) {
		event.stopPropagation();
		open = !open;
	}

	function select(value: (typeof SORT_OPTIONS)[number]['value'], event: MouseEvent) {
		event.stopPropagation();
		sortBy = value;
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

<div class="farm-sort" bind:this={root}>
	<button
		type="button"
		class="farm-sort__trigger"
		class:farm-sort__trigger--open={open}
		class:farm-sort__trigger--selected={sortBy !== null}
		aria-expanded={open}
		aria-haspopup="listbox"
		onclick={toggle}
	>
		<span class="farm-sort__label">{selectedLabel}</span>
		<span class="farm-sort__chevron" aria-hidden="true">›</span>
	</button>

	{#if open}
		<ul class="farm-sort__menu" role="listbox" aria-label="Sort farms by">
			{#each SORT_OPTIONS as option (option.value)}
				<li role="presentation">
					<button
						type="button"
						class="farm-sort__option"
						class:farm-sort__option--selected={sortBy === option.value}
						role="option"
						aria-selected={sortBy === option.value}
						onclick={(event) => select(option.value, event)}
					>
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
