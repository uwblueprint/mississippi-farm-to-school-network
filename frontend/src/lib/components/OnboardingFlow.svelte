<script lang="ts">
	import { tick } from 'svelte';
	import OnboardingModal from './OnboardingModal.svelte';

	type Placement = 'right' | 'left' | 'bottom' | 'top';

	interface Step {
		title: string;
		body: string;
		/** CSS selector of the element to spotlight; the card is centered without one. */
		target?: string;
		/** Preferred sides for the card, tried in order until one fits. */
		placements?: Placement[];
		/** The spotlit element stays clickable (and is the only way forward). */
		interactive?: boolean;
		secondaryLabel?: string;
		primaryLabel?: string;
	}

	interface Props {
		/** Step to open on (the dashboard steps when resuming after the form). */
		startStep?: number;
		/** Selector of the farm card to spotlight; omitted when the farmer has no farm. */
		farmSelector?: string;
		/** Fires when the farmer clicks the spotlit "Add farm" button. */
		onAddFarm: () => void;
		/** Fires when the tour finishes. */
		onComplete: () => void;
	}

	let { startStep = 0, farmSelector, onAddFarm, onComplete }: Props = $props();

	const steps: Step[] = $derived([
		{
			title: 'Manage your profile',
			body: 'Access your settings to manage your account details.',
			target: '[data-onboarding="profile"]',
			placements: ['right', 'top'],
			primaryLabel: 'Continue'
		},
		{
			title: 'Add a Farm',
			body: 'Let’s get your farm on the map. Click “Add farm” to register your first farm. You will need to submit a farm to continue.',
			target: '[data-onboarding="add-farm"]',
			placements: ['bottom', 'left'],
			interactive: true
		},
		farmSelector
			? {
					title: 'Farm Cards',
					body: 'Your farm appears on the dashboard once submitted. You can see its name, location, and current status.',
					target: farmSelector,
					placements: ['right', 'bottom', 'left'],
					primaryLabel: 'Continue'
				}
			: {
					title: 'Farm Cards',
					body: 'Once you submit a farm, it appears here on your dashboard with its name, location, and current status.',
					primaryLabel: 'Continue'
				},
		farmSelector
			? {
					title: 'Status Badge',
					body: 'Your farm is currently under review. Once MFSN approves it, the badge will update and the farm becomes visible to schools across Mississippi.',
					target: `${farmSelector} .farm-card__status`,
					placements: ['right', 'bottom', 'left'],
					secondaryLabel: 'Back',
					primaryLabel: 'Continue'
				}
			: {
					title: 'Status Badge',
					body: 'Each farm shows a status badge. While MFSN reviews a farm it reads Pending; once approved, the farm becomes visible to schools across Mississippi.',
					secondaryLabel: 'Back',
					primaryLabel: 'Continue'
				},
		farmSelector
			? {
					title: 'You’re all set!',
					body: 'Your farm profile is submitted and in the process of being reviewed. Once approved, you will receive an email notifying the status update.',
					secondaryLabel: 'Back',
					primaryLabel: 'Done'
				}
			: {
					title: 'You’re all set!',
					body: 'You can add your farm any time with the “Add farm” button. Once it’s approved, you will receive an email notifying the status update.',
					secondaryLabel: 'Back',
					primaryLabel: 'Done'
				}
	]);

	// svelte-ignore state_referenced_locally
	let step = $state(startStep);
	const current = $derived(steps[step]);
	const stepLabel = $derived(`Step ${step + 1} of ${steps.length}`);

	const HOLE_PADDING = 8;
	const GAP = 24;
	const MARGIN = 16;

	interface Box {
		x: number;
		y: number;
		w: number;
		h: number;
	}

	let hole = $state<Box | null>(null);
	let viewportWidth = $state(0);
	let viewportHeight = $state(0);
	let cardWidth = $state(0);
	let cardHeight = $state(0);

	function targetElement(): HTMLElement | null {
		return current.target ? document.querySelector<HTMLElement>(current.target) : null;
	}

	function measure() {
		const rect = targetElement()?.getBoundingClientRect();
		hole =
			rect && rect.width > 0
				? {
						x: rect.left - HOLE_PADDING,
						y: rect.top - HOLE_PADDING,
						w: rect.width + HOLE_PADDING * 2,
						h: rect.height + HOLE_PADDING * 2
					}
				: null;
	}

	$effect(() => {
		void current;
		let target: HTMLElement | null = null;
		const onTargetClick = () => onAddFarm();

		tick().then(() => {
			target = targetElement();
			target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			if (current.interactive) target?.addEventListener('click', onTargetClick);
			measure();
		});

		window.addEventListener('scroll', measure, true);
		window.addEventListener('resize', measure);
		return () => {
			target?.removeEventListener('click', onTargetClick);
			window.removeEventListener('scroll', measure, true);
			window.removeEventListener('resize', measure);
		};
	});

	const clamp = (value: number, min: number, max: number) =>
		Math.max(min, Math.min(value, Math.max(min, max)));

	/** Card position beside the spotlit element; null centers it. */
	const cardPosition = $derived.by((): { top: number; left: number } | null => {
		if (!hole || !cardWidth) return null;
		const maxLeft = viewportWidth - cardWidth - MARGIN;
		const maxTop = viewportHeight - cardHeight - MARGIN;
		for (const side of current.placements ?? []) {
			if (side === 'right' && hole.x + hole.w + GAP + cardWidth <= viewportWidth - MARGIN) {
				return { left: hole.x + hole.w + GAP, top: clamp(hole.y, MARGIN, maxTop) };
			}
			if (side === 'left' && hole.x - GAP - cardWidth >= MARGIN) {
				return { left: hole.x - GAP - cardWidth, top: clamp(hole.y, MARGIN, maxTop) };
			}
			if (side === 'bottom' && hole.y + hole.h + GAP + cardHeight <= viewportHeight - MARGIN) {
				return {
					left: clamp(hole.x + hole.w - cardWidth, MARGIN, maxLeft),
					top: hole.y + hole.h + GAP
				};
			}
			if (side === 'top' && hole.y - GAP - cardHeight >= MARGIN) {
				return { left: clamp(hole.x, MARGIN, maxLeft), top: hole.y - GAP - cardHeight };
			}
		}
		return null;
	});

	function advance() {
		if (step === steps.length - 1) {
			onComplete();
			return;
		}
		step += 1;
	}

	function back() {
		step -= 1;
	}

	function handleKeydown(event: KeyboardEvent) {
		// The first two steps can't be skipped; later ones can be dismissed.
		if (event.key === 'Escape' && step >= 2) onComplete();
	}
</script>

<svelte:window
	onkeydown={handleKeydown}
	bind:innerWidth={viewportWidth}
	bind:innerHeight={viewportHeight}
/>

<div class="tour">
	{#if hole}
		<!-- four dimmed panels around the spotlight; they also block clicks outside it -->
		<div
			class="tour__shade"
			style="left:0; top:0; width:100%; height:{Math.max(0, hole.y)}px"
		></div>
		<div class="tour__shade" style="left:0; top:{hole.y + hole.h}px; width:100%; bottom:0"></div>
		<div
			class="tour__shade"
			style="left:0; top:{hole.y}px; width:{Math.max(0, hole.x)}px; height:{hole.h}px"
		></div>
		<div
			class="tour__shade"
			style="left:{hole.x + hole.w}px; top:{hole.y}px; right:0; height:{hole.h}px"
		></div>
		<div
			class="tour__spotlight"
			class:tour__spotlight--interactive={current.interactive}
			style="left:{hole.x}px; top:{hole.y}px; width:{hole.w}px; height:{hole.h}px"
		></div>
		{#if !current.interactive}
			<div
				class="tour__blocker"
				style="left:{hole.x}px; top:{hole.y}px; width:{hole.w}px; height:{hole.h}px"
			></div>
		{/if}
	{:else}
		<div class="tour__shade" style="inset:0"></div>
	{/if}

	<div
		class="tour__card"
		class:tour__card--centered={!cardPosition}
		style={cardPosition ? `left:${cardPosition.left}px; top:${cardPosition.top}px` : ''}
		bind:offsetWidth={cardWidth}
		bind:offsetHeight={cardHeight}
	>
		<OnboardingModal
			{stepLabel}
			title={current.title}
			body={current.body}
			primaryLabel={current.primaryLabel}
			secondaryLabel={current.secondaryLabel}
			onPrimary={advance}
			onSecondary={back}
		/>
	</div>
</div>

<style>
	.tour {
		position: fixed;
		inset: 0;
		z-index: 50;
		pointer-events: none;
	}

	.tour__shade,
	.tour__blocker {
		position: fixed;
		pointer-events: auto;
	}

	.tour__shade {
		background: rgba(18, 24, 14, 0.45);
	}

	.tour__spotlight {
		position: fixed;
		border-radius: 14px;
		box-shadow:
			0 0 0 2px rgba(255, 255, 255, 0.9),
			0 12px 32px rgba(18, 24, 14, 0.25);
		transition:
			left 200ms ease,
			top 200ms ease,
			width 200ms ease,
			height 200ms ease;
	}

	.tour__spotlight--interactive {
		animation: tour-pulse 1.8s ease-out infinite;
	}

	@keyframes tour-pulse {
		0% {
			box-shadow:
				0 0 0 2px rgba(255, 255, 255, 0.9),
				0 0 0 2px rgba(191, 220, 168, 0.9);
		}
		100% {
			box-shadow:
				0 0 0 2px rgba(255, 255, 255, 0.9),
				0 0 0 14px rgba(191, 220, 168, 0);
		}
	}

	.tour__card {
		position: fixed;
		max-width: calc(100vw - 32px);
		pointer-events: auto;
	}

	.tour__card--centered {
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	@media (prefers-reduced-motion: reduce) {
		.tour__spotlight {
			transition: none;
		}

		.tour__spotlight--interactive {
			animation: none;
		}
	}
</style>
