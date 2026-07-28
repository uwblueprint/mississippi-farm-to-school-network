<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Minimal centered modal shell: dimmed backdrop, close X, Escape/backdrop to
	 * dismiss. The children supply their own surface (e.g. RequestedChangesCard /
	 * ApprovedCard), so this only positions and closes.
	 */
	interface Props {
		/** Accessible name for the dialog. */
		label: string;
		onClose: () => void;
		children: Snippet;
	}

	let { label, onClose, children }: Props = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" role="dialog" aria-modal="true" aria-label={label}>
	<button class="backdrop" type="button" aria-label="Close" onclick={onClose}></button>

	<div class="panel">
		<button class="close" type="button" aria-label="Close" onclick={onClose}>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M18 6L6 18M6 6L18 18"
					stroke="var(--mfsn-icon-close, #414141)"
					stroke-width="2.5"
					stroke-linecap="round"
				/>
			</svg>
		</button>
		{@render children()}
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		padding: 1.5em;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		border: none;
		padding: 0;
		background: rgba(19, 25, 39, 0.45);
		cursor: default;
	}

	.panel {
		position: relative;
		max-width: min(720px, 100%);
		max-height: 100%;
		overflow-y: auto;
	}

	.close {
		position: absolute;
		top: 24px;
		right: 24px;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border: none;
		background: none;
		cursor: pointer;
	}
</style>
