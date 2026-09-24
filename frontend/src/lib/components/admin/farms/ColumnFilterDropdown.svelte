<script lang="ts">
	import {
		characteristicFilterLabel,
		interestFilterLabel,
		type FilterableColumn
	} from '$lib/utils/admin-farms';

	interface Props {
		column: FilterableColumn;
		label: string;
		options: readonly string[];
		selected: string[];
		open: boolean;
		onToggle: () => void;
		onChange: (next: string[]) => void;
	}

	let { column, label, options, selected, open, onToggle, onChange }: Props = $props();

	let rootEl: HTMLDivElement | undefined = $state();
	let menuStyle = $state('');

	$effect(() => {
		if (!open || !rootEl) {
			menuStyle = '';
			return;
		}

		const place = () => {
			const rect = rootEl!.getBoundingClientRect();
			const width = 220;
			const left = Math.min(rect.left, window.innerWidth - width - 8);
			menuStyle = `top:${rect.bottom + 6}px;left:${Math.max(8, left)}px;width:${width}px;`;
		};
		place();

		const onPointerDown = (event: PointerEvent) => {
			if (!rootEl?.contains(event.target as Node | null)) {
				const menu = document.getElementById(`farms-filter-menu-${column}`);
				if (menu?.contains(event.target as Node | null)) return;
				onToggle();
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onToggle();
		};
		window.addEventListener('resize', place);
		window.addEventListener('scroll', place, true);
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', place, true);
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	function optionLabel(option: string): string {
		if (column === 'interest') return interestFilterLabel(option);
		if (column === 'farm_characteristics') return characteristicFilterLabel(option);
		return option;
	}

	function toggleOption(option: string) {
		if (selected.includes(option)) {
			onChange(selected.filter((v) => v !== option));
		} else {
			onChange([...selected, option]);
		}
	}
</script>

<div class="farms-filter" class:farms-filter--active={selected.length > 0} bind:this={rootEl}>
	<button
		class="farms-table__header-btn"
		type="button"
		aria-expanded={open}
		aria-haspopup="listbox"
		onclick={(e) => {
			e.stopPropagation();
			onToggle();
		}}
	>
		<span>{label}</span>
		<img class="farms-table__header-icon" src="/images/admin/filterLinesIcon.svg" alt="" />
	</button>

	{#if open}
		<div
			id={`farms-filter-menu-${column}`}
			class="farms-filter__menu farms-filter__menu--fixed"
			style={menuStyle}
			role="listbox"
			aria-label={`Filter by ${label}`}
			aria-multiselectable="true"
		>
			<div class="farms-filter__title">{label}</div>
			{#each options as option (option)}
				{@const checked = selected.includes(option)}
				<button
					class="farms-filter__option"
					type="button"
					role="option"
					aria-selected={checked}
					onclick={() => toggleOption(option)}
				>
					<span class="farms-checkbox" class:farms-checkbox--checked={checked} aria-hidden="true">
						{#if checked}
							<img src="/images/admin/checkboxCheckIcon.svg" alt="" />
						{/if}
					</span>
					<span>{optionLabel(option)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
