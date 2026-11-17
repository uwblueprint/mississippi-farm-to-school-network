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

	let closeButton = $state<HTMLButtonElement | null>(null);

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}

	// While open: lock the page scroll and move focus into the dialog.
	$effect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeButton?.focus();
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" role="dialog" aria-modal="true" aria-label={label}>
	<button class="backdrop" type="button" aria-label="Close" onclick={onClose}></button>

	<div class="panel">
		<button
			bind:this={closeButton}
			class="close"
			type="button"
			aria-label="Close"
			onclick={onClose}
		>
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

	/* 44px tap target; the icon stays where the old 30px button drew it. */
	.close {
		position: absolute;
		top: 17px;
		right: 17px;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: none;
		border-radius: 8px;
		background: none;
		cursor: pointer;
	}

	.close:focus-visible {
		outline: 2px solid var(--mfsn-primary, #587244);
		outline-offset: -2px;
	}

	/* Phones: 16px side margins instead of the desktop gutter, and keep clear
	   of the notch / home indicator. */
	@media (max-width: 767px) {
		.overlay {
			padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
		}

		.panel {
			max-width: 100%;
		}

		.close {
			top: 6px;
			right: 6px;
		}
	}
</style>
