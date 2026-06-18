<script lang="ts">
	interface Announcement {
		title: string;
		date: string;
	}

	interface Props {
		announcements?: Announcement[];
		expanded?: boolean;
	}

	let {
		announcements = [
			{
				title:
					'The Regional Mississippi Farming Convention is happening this Sunday! Come drop by and meet all the other farmers!',
				date: 'June 11, 2026'
			},
			{
				title: 'New seasonal produce listings are now open for the summer term.',
				date: 'June 14, 2026'
			}
		],
		expanded = false
	}: Props = $props();

	let index = $state(0);
	const current = $derived(announcements[index]);
	const count = $derived(announcements.length);

	let availW = $state(0);
	let maxH = $state(0);
	let active = $state(false);
	let canHover = $state(true);
	let frameEl: HTMLDivElement | undefined = $state();

	const open = $derived(expanded || active);

	$effect(() => {
		const mq = window.matchMedia('(hover: hover)');
		const sync = () => (canHover = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		if (!open) return;
		const onDocPointerDown = (event: PointerEvent) => {
			if (!frameEl?.contains(event.target as Node | null)) {
				active = false;
			}
		};
		document.addEventListener('pointerdown', onDocPointerDown);
		return () => document.removeEventListener('pointerdown', onDocPointerDown);
	});

	function prev() {
		index = (index - 1 + count) % count;
	}

	function next() {
		index = (index + 1) % count;
	}

	function onPointerUp(event: PointerEvent) {
		if (event.pointerType === 'mouse') return;
		if ((event.target as HTMLElement).closest('button')) return;
		active = !active;
	}

	function onFocusOut(event: FocusEvent) {
		if (!frameEl?.contains(event.relatedTarget as Node | null)) {
			active = false;
		}
	}
</script>

{#snippet alertIcon()}
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path
			d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet chevron()}
	<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path
			d="M18.75 22.5L11.25 15L18.75 7.5"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<div class="promo-root" bind:clientWidth={availW} style="--avail:{availW}px; --max-h:{maxH}px;">
	<div
		class="promo-frame"
		class:open
		bind:this={frameEl}
		role="group"
		onmouseenter={() => canHover && (active = true)}
		onmouseleave={() => canHover && (active = false)}
		onpointerup={onPointerUp}
		onfocusin={() => (active = true)}
		onfocusout={onFocusOut}
	>
		<div class="promo-layout">
			<span class="promo-icon">{@render alertIcon()}</span>

			<div class="promo-content">
				<p class="promo-title">{current.title}</p>
				<p class="promo-caption">{current.date}</p>
			</div>

			{#if count > 1}
				<div class="promo-pager">
					<button
						class="promo-chevron"
						type="button"
						aria-label="Previous announcement"
						onclick={prev}
					>
						{@render chevron()}
					</button>
					<span class="promo-count">{index + 1}/{count}</span>
					<button
						class="promo-chevron promo-chevron-right"
						type="button"
						aria-label="Next announcement"
						onclick={next}
					>
						{@render chevron()}
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="promo-measure" aria-hidden="true" bind:clientHeight={maxH}>
		{#each announcements as a (a.title)}
			<div class="promo-layout">
				<span class="promo-icon">{@render alertIcon()}</span>

				<div class="promo-content">
					<p class="promo-title">{a.title}</p>
					<p class="promo-caption">{a.date}</p>
				</div>

				{#if count > 1}
					<div class="promo-pager">
						<span class="promo-chevron">{@render chevron()}</span>
						<span class="promo-count">{index + 1}/{count}</span>
						<span class="promo-chevron promo-chevron-right">{@render chevron()}</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.promo-root {
		position: relative;
		width: 100%;
	}

	.promo-frame {
		width: 4.5rem;
		height: 4.5rem;
		overflow: hidden;
		background: var(--color-neutral-0);
		border-radius: 15px;
		box-shadow: inset 0 0 0 1.5px var(--color-neutral-300);
		transition:
			width 350ms ease 200ms,
			height 350ms ease 200ms;
	}

	.promo-frame.open {
		width: var(--avail);
		height: var(--max-h);
		transition:
			width 350ms ease,
			height 350ms ease;
	}

	.promo-layout {
		width: var(--avail);
		min-height: var(--max-h);
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1.5rem;
	}

	.promo-measure {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--avail);
		display: grid;
		visibility: hidden;
		pointer-events: none;
	}

	.promo-measure .promo-layout {
		grid-column: 1;
		grid-row: 1;
		min-height: 0;
	}

	.promo-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		height: 1.5rem;
		color: var(--color-accent-200);
	}

	.promo-icon :global(svg) {
		display: block;
		width: 1.5rem;
		height: 1.5rem;
	}

	.promo-content {
		flex: 1;
		min-width: 0;
	}

	.promo-title,
	.promo-caption,
	.promo-pager {
		opacity: 0;
		transform: translateY(0.375rem);
		transition:
			opacity 200ms ease,
			transform 200ms ease;
	}

	.promo-frame.open .promo-title {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 250ms ease 250ms,
			transform 250ms ease 250ms;
	}

	.promo-frame.open .promo-caption {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 250ms ease 330ms,
			transform 250ms ease 330ms;
	}

	.promo-frame.open .promo-pager {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 250ms ease 410ms,
			transform 250ms ease 410ms;
	}

	.promo-title {
		margin: 0;
		font-family: var(--type-b1-font);
		font-weight: var(--type-b1-weight);
		font-size: var(--type-b1-size);
		line-height: 1.4;
		color: #000000;
	}

	.promo-caption {
		margin: 0.375rem 0 0;
		font-family: var(--type-c1-font);
		font-weight: var(--type-c1-weight);
		font-size: var(--type-c1-size);
		line-height: 1.4;
		color: var(--color-neutral-500);
	}

	.promo-pager {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		align-self: flex-end;
	}

	.promo-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: #000000;
	}

	.promo-chevron :global(svg) {
		display: block;
		width: 1.875rem;
		height: 1.875rem;
	}

	.promo-chevron-right :global(svg) {
		transform: scaleX(-1);
	}

	.promo-count {
		min-width: 1.5rem;
		text-align: center;
		font-family: var(--type-c1-font);
		font-weight: var(--type-c1-weight);
		font-size: var(--type-c1-size);
		color: var(--color-neutral-500);
	}

	@media (prefers-reduced-motion: reduce) {
		.promo-frame,
		.promo-frame.open,
		.promo-title,
		.promo-caption,
		.promo-pager,
		.promo-frame.open .promo-title,
		.promo-frame.open .promo-caption,
		.promo-frame.open .promo-pager {
			transition: none;
		}
	}
</style>
