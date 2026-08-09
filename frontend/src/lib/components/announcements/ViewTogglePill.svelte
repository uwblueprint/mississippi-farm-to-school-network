<script lang="ts">
	type View = 'list' | 'calendar';

	interface Props {
		view: View;
		onchange: (view: View) => void;
	}

	let { view, onchange }: Props = $props();
</script>

<div class="view-pill" role="tablist" aria-label="Announcements view">
	<button
		class="pill-option"
		class:pill-option--active={view === 'list'}
		type="button"
		role="tab"
		aria-selected={view === 'list'}
		onclick={() => onchange('list')}
	>
		List
	</button>
	<button
		class="pill-option"
		class:pill-option--active={view === 'calendar'}
		type="button"
		role="tab"
		aria-selected={view === 'calendar'}
		onclick={() => onchange('calendar')}
	>
		Calendar
	</button>
</div>

<style>
	.view-pill {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: fit-content;
		padding: 0.5rem;
		background: var(--color-neutral-200);
		border: 1px solid var(--color-neutral-300);
		border-radius: 30px;
	}

	.pill-option {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 6.25rem;
		height: 1.8125rem;
		padding: 0.25rem 1.5rem;
		background: transparent;
		border: none;
		border-radius: 30px;
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-b3);
		line-height: 1.5rem;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.pill-option--active {
		background: var(--color-neutral-0);
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.15);
		color: var(--color-text-primary);
	}
</style>
