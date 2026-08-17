<script lang="ts">
	import type { Snippet } from 'svelte';
	import closeIcon from '$lib/assets/announcements/modal-close.svg';

	interface Props {
		title: string;
		body: Snippet;
		confirmLabel?: string;
		tone?: 'primary' | 'danger';
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		title,
		body,
		confirmLabel = 'Confirm',
		tone = 'primary',
		onconfirm,
		oncancel
	}: Props = $props();

	let dialogEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') oncancel();
		};
		const onPointerDown = (event: PointerEvent) => {
			if (!dialogEl?.contains(event.target as Node | null)) oncancel();
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
		};
	});
</script>

<div class="confirm-backdrop">
	<div
		class="confirm-dialog"
		bind:this={dialogEl}
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<button class="confirm-close" type="button" aria-label="Close" onclick={oncancel}>
			<img src={closeIcon} alt="" />
		</button>

		<div class="confirm-content">
			<h2 class="confirm-title">{title}</h2>
			<p class="confirm-body">{@render body()}</p>
		</div>

		<div class="confirm-actions">
			<button class="confirm-cancel" type="button" onclick={oncancel}>Cancel</button>
			<button
				class="confirm-submit"
				class:confirm-submit--danger={tone === 'danger'}
				type="button"
				onclick={onconfirm}
			>
				{confirmLabel}
			</button>
		</div>
	</div>
</div>

<style>
	.confirm-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(30, 30, 30, 0.15);
	}

	.confirm-dialog {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 29.125rem;
		max-width: 100%;
		padding: 2.25rem 2rem;
		background: var(--color-neutral-0);
		border-radius: 20px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.confirm-close {
		position: absolute;
		top: 1.5rem;
		right: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.confirm-close img {
		display: block;
		width: 15.83px;
		height: 15.83px;
	}

	.confirm-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.confirm-title {
		margin: 0;
		padding-right: 2.5rem;
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-medium);
		font-size: 1.75rem;
		line-height: 1.2;
		color: var(--color-text-primary);
	}

	.confirm-body {
		margin: 0;
		font-family: var(--type-b3-font);
		font-weight: var(--type-b3-weight);
		font-size: var(--type-b3-size);
		line-height: 1.5rem;
		color: var(--color-text-primary);
	}

	.confirm-body :global(strong) {
		font-weight: var(--font-weight-bold);
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.confirm-cancel,
	.confirm-submit {
		height: 2.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		cursor: pointer;
	}

	.confirm-cancel {
		background: var(--color-neutral-0);
		border: 1px solid var(--mfsn-primary-400);
		color: var(--mfsn-primary-400);
	}

	.confirm-cancel:hover {
		background: var(--mfsn-primary-tint);
	}

	.confirm-submit {
		background: var(--mfsn-primary-400);
		border: none;
		color: #ffffff;
	}

	.confirm-submit:hover {
		background: var(--mfsn-primary-hover);
	}

	.confirm-submit--danger {
		background: var(--mfsn-secondary-500);
	}

	.confirm-submit--danger:hover {
		background: var(--mfsn-secondary-600);
	}
</style>
