<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fade, type TransitionConfig } from 'svelte/transition';
	import { toast } from '$lib/state/toast.svelte';
	import checkIcon from '$lib/assets/announcements/check.svg';
	import trashIcon from '$lib/assets/announcements/trash.svg';

	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function riseIn(node: Element): TransitionConfig {
		void node;
		if (reducedMotion) return { duration: 0 };
		return {
			duration: 280,
			easing: cubicOut,
			css: (t: number, u: number) =>
				`opacity: ${t}; transform: translateY(${u * 0.75}rem) scale(${0.85 + t * 0.15});`
		};
	}
</script>

{#if toast.current}
	{#key toast.current.id}
		<div
			class="toast"
			role="status"
			aria-live="polite"
			in:riseIn|global
			out:fade|global={{ duration: reducedMotion ? 0 : 180 }}
		>
			{#if toast.current.kind === 'success'}
				<span class="toast-badge">
					<img class="icon-check" src={checkIcon} alt="" />
				</span>
			{:else if toast.current.kind === 'delete'}
				<img class="icon-trash" src={trashIcon} alt="" />
			{/if}
			<p class="toast-message">{toast.current.message}</p>
		</div>
	{/key}
{/if}

<style>
	.toast {
		position: fixed;
		right: 2.25rem;
		bottom: 2.25rem;
		z-index: 60;
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 22rem;
		max-width: calc(100vw - 4.5rem);
		padding: 1.25rem 1.5rem;
		background: var(--color-neutral-0);
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
		transform-origin: bottom right;
	}

	.toast-badge {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		background: var(--mfsn-success-100);
		border-radius: 50%;
	}

	.icon-check {
		display: block;
		width: 8.67px;
		height: 6.33px;
	}

	.icon-trash {
		display: block;
		flex-shrink: 0;
		width: 16.2px;
		height: 17.87px;
	}

	.toast-message {
		margin: 0;
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-b3);
		line-height: 1.5rem;
		color: var(--color-text-secondary);
	}
</style>
