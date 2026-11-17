<script lang="ts" module>
	export type SheetSnap = 'peek' | 'half' | 'full';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		snap?: SheetSnap;
		topReserve?: number;
		visibleHeight?: number;
		label: string;
		header: Snippet;
		children: Snippet;
	}

	let {
		snap = $bindable('half'),
		topReserve = 0,
		visibleHeight = $bindable(0),
		label,
		header,
		children
	}: Props = $props();

	const PEEK_RATIO = 0.15;
	const HALF_RATIO = 0.5;
	const FULL_RATIO = 0.9;
	const PEEK_MIN_PX = 88;
	const FULL_GAP_PX = 8;
	const DRAG_SLOP_PX = 6;
	const FLING_PROJECTION_MS = 150;
	const SNAP_ORDER: SheetSnap[] = ['peek', 'half', 'full'];

	let viewportHeight = $state(0);
	let headerHeight = $state(0);
	let headerEl = $state<HTMLDivElement | null>(null);
	let dragHeight = $state<number | null>(null);

	const snapHeights = $derived.by(() => {
		const peek = Math.max(viewportHeight * PEEK_RATIO, PEEK_MIN_PX);
		const half = Math.max(viewportHeight * HALF_RATIO, peek);
		const full = Math.max(
			Math.min(viewportHeight * FULL_RATIO, viewportHeight - topReserve - FULL_GAP_PX),
			half
		);
		return { peek, half, full };
	});

	const height = $derived(dragHeight ?? snapHeights[snap]);
	const bodyHeight = $derived(Math.max(height, snapHeights[snap]) - headerHeight);

	$effect(() => {
		visibleHeight = height;
	});

	function nearestSnap(target: number): SheetSnap {
		return SNAP_ORDER.reduce((best, key) =>
			Math.abs(snapHeights[key] - target) < Math.abs(snapHeights[best] - target) ? key : best
		);
	}

	function cycleSnap() {
		snap = snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half';
	}

	$effect(() => {
		const el = headerEl;
		if (!el) return;

		let start: { y: number; height: number; pointerId: number } | null = null;
		let dragging = false;
		let suppressClick = false;
		let last = { y: 0, t: 0 };
		let velocity = 0;

		function onPointerDown(event: PointerEvent) {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			start = { y: event.clientY, height, pointerId: event.pointerId };
			dragging = false;
			suppressClick = false;
			last = { y: event.clientY, t: event.timeStamp };
			velocity = 0;
			window.addEventListener('pointermove', onPointerMove, true);
			window.addEventListener('pointerup', onPointerEnd, true);
			window.addEventListener('pointercancel', onPointerEnd, true);
		}

		function onPointerMove(event: PointerEvent) {
			if (!start || event.pointerId !== start.pointerId) return;
			const delta = start.y - event.clientY;

			if (!dragging) {
				if (Math.abs(delta) < DRAG_SLOP_PX) return;
				dragging = true;
			}

			const dt = event.timeStamp - last.t;
			if (dt > 0) velocity = (last.y - event.clientY) / dt;
			last = { y: event.clientY, t: event.timeStamp };

			dragHeight = Math.min(Math.max(start.height + delta, snapHeights.peek), snapHeights.full);
		}

		function stopTracking() {
			window.removeEventListener('pointermove', onPointerMove, true);
			window.removeEventListener('pointerup', onPointerEnd, true);
			window.removeEventListener('pointercancel', onPointerEnd, true);
		}

		function onPointerEnd(event: PointerEvent) {
			if (!start || event.pointerId !== start.pointerId) return;
			stopTracking();
			if (dragging && dragHeight !== null) {
				snap = nearestSnap(dragHeight + velocity * FLING_PROJECTION_MS);
				suppressClick = true;
			}
			start = null;
			dragging = false;
			dragHeight = null;
		}

		function onClickCapture(event: MouseEvent) {
			if (!suppressClick) return;
			suppressClick = false;
			event.stopPropagation();
			event.preventDefault();
		}

		el.addEventListener('pointerdown', onPointerDown);
		el.addEventListener('click', onClickCapture, true);

		return () => {
			stopTracking();
			el.removeEventListener('pointerdown', onPointerDown);
			el.removeEventListener('click', onClickCapture, true);
		};
	});
</script>

<svelte:window bind:innerHeight={viewportHeight} />

<section
	class="mobile-sheet"
	class:mobile-sheet--dragging={dragHeight !== null}
	aria-label={label}
	style:height="{snapHeights.full}px"
	style:transform="translateY({snapHeights.full - height}px)"
>
	<div class="mobile-sheet__header" bind:this={headerEl} bind:offsetHeight={headerHeight}>
		<button
			type="button"
			class="mobile-sheet__handle"
			aria-label={snap === 'full' ? 'Collapse results' : 'Expand results'}
			onclick={cycleSnap}
		>
			<span class="mobile-sheet__grip" aria-hidden="true"></span>
		</button>
		{@render header()}
	</div>

	<div class="mobile-sheet__body" style:height="{Math.max(bodyHeight, 0)}px">
		{@render children()}
	</div>
</section>

<style>
	.mobile-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 3;
		display: flex;
		flex-direction: column;
		border-radius: 1rem 1rem 0 0;
		background: #fff;
		box-shadow: 0 -2px 12px rgba(19, 25, 39, 0.15);
		transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
		will-change: transform;
	}

	.mobile-sheet--dragging {
		transition: none;
	}

	.mobile-sheet__header {
		flex-shrink: 0;
		padding: 0 1rem 0.5rem;
		border-bottom: 1px solid #f0f0f0;
		touch-action: none;
		cursor: grab;
		user-select: none;
	}

	.mobile-sheet--dragging .mobile-sheet__header {
		cursor: grabbing;
	}

	.mobile-sheet__handle {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 0.625rem 0 0.5rem;
		border: none;
		background: none;
		cursor: inherit;
	}

	.mobile-sheet__grip {
		width: 2.5rem;
		height: 0.3125rem;
		border-radius: 999px;
		background: #d3d5de;
	}

	.mobile-sheet__body {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}
</style>
