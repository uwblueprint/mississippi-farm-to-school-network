<script lang="ts">
	import { slide } from 'svelte/transition';
	import MegaphoneIcon from '$lib/components/map/MegaphoneIcon.svelte';
	import { announcementBar, minimizeAnnouncements } from '$lib/state/announcementBar.svelte';

	interface Props {
		/** Fires after the bar finishes opening/closing, so the map can resize. */
		onLayoutChange?: () => void;
	}

	let { onLayoutChange }: Props = $props();

	let index = $state(0);

	const announcements = $derived(announcementBar.items);
	const count = $derived(announcements.length);
	const shown = $derived(count > 0 ? Math.min(index, count - 1) : 0);
	const current = $derived(announcements[shown]);

	const prev = () => (index = (shown - 1 + count) % count);
	const next = () => (index = (shown + 1) % count);
</script>

{#snippet chevron(direction: 'left' | 'right')}
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.25"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
	</svg>
{/snippet}

{#if current && !announcementBar.minimized}
	<section
		class="announcement-bar"
		aria-label="Announcements"
		transition:slide={{ duration: 220 }}
		onintroend={onLayoutChange}
		onoutroend={onLayoutChange}
	>
		<span class="announcement-bar__icon"><MegaphoneIcon size={18} /></span>

		<div class="announcement-bar__body" aria-live="polite">
			<p class="announcement-bar__message">{@html current.title}</p>
		</div>

		<div class="announcement-bar__aside">
			<div class="announcement-bar__controls">
				{#if count > 1}
					<div class="announcement-bar__pager">
						<button
							type="button"
							class="announcement-bar__btn"
							aria-label="Previous announcement"
							onclick={prev}
						>
							{@render chevron('left')}
						</button>
						<span class="announcement-bar__count">{shown + 1} / {count}</span>
						<button
							type="button"
							class="announcement-bar__btn"
							aria-label="Next announcement"
							onclick={next}
						>
							{@render chevron('right')}
						</button>
					</div>
				{/if}
				<button
					type="button"
					class="announcement-bar__btn"
					aria-label="Minimize announcements"
					onclick={minimizeAnnouncements}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
			<span class="announcement-bar__date">{current.date}</span>
		</div>
	</section>
{/if}

<style>
	.announcement-bar {
		position: relative;
		z-index: 5;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 2.25rem; /* lines up with the sidebar's side padding */
		background:
			radial-gradient(120% 220% at 0% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 55%),
			linear-gradient(90deg, #3f5630 0%, #587244 100%);
		border: 3px solid #bfdca8;
		border-top: none;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.12),
			0 4px 12px rgba(19, 25, 39, 0.16);
		color: #fff;
		font-family: 'DM Sans', sans-serif;
	}

	.announcement-bar__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		background: #fcefcb;
		color: #455d32;
		box-shadow:
			0 0 0 4px rgba(252, 239, 203, 0.18),
			0 2px 6px rgba(19, 25, 39, 0.2);
	}

	.announcement-bar__body {
		flex: 1;
		min-width: 0;
	}

	.announcement-bar__message {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.4;
		color: #fff;
		text-shadow: 0 1px 1px rgba(19, 25, 39, 0.2);
	}

	.announcement-bar__message :global(a) {
		color: #fff;
		font-weight: 700;
		text-decoration: underline;
		text-decoration-color: #fcefcb;
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
	}

	.announcement-bar__message :global(a:hover) {
		color: #fcefcb;
	}

	.announcement-bar__aside {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.announcement-bar__date {
		font-size: 0.6875rem;
		font-weight: 500;
		line-height: 1;
		letter-spacing: 0.02em;
		color: rgba(252, 239, 203, 0.85);
		white-space: nowrap;
	}

	.announcement-bar__controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.announcement-bar__pager {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.125rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 999px;
		background: rgba(19, 25, 39, 0.16);
		box-shadow: inset 0 1px 2px rgba(19, 25, 39, 0.18);
	}

	.announcement-bar__count {
		min-width: 2.5rem;
		text-align: center;
		font-size: 0.8125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: rgba(255, 255, 255, 0.85);
	}

	.announcement-bar__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: transparent;
		color: #fff;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.announcement-bar__btn:hover {
		background: rgba(255, 255, 255, 0.16);
	}

	.announcement-bar__btn:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.announcement-bar {
			align-items: flex-start;
			padding: 0.75rem 1rem;
		}

		.announcement-bar__icon {
			display: none;
		}

		.announcement-bar__message {
			padding-top: 0.375rem;
		}
	}
</style>
