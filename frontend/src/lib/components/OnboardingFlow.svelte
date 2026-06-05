<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cubicOut } from 'svelte/easing';
	import OnboardingModal from './OnboardingModal.svelte';

	const FARM_CREATION_ROUTE = '/new-farm';

	interface Step {
		title: string;
		body: string;
		secondaryLabel?: string;
		primaryLabel: string;
	}

	const steps: Step[] = [
		{
			title: 'Welcome!',
			body: 'This is your hub for managing your farm profile on the Mississippi Farm to School Network. Schools and partners discover farms like yours here.',
			primaryLabel: 'Continue'
		},
		{
			title: 'Update your Profile',
			body: 'Your profile section at the bottom left shows your name and role. Keep your contact details up to date so MFSN and schools can reach you easily.',
			secondaryLabel: 'Back',
			primaryLabel: 'Continue'
		},
		{
			title: 'Create a Farm',
			body: 'Let’s get your farm on the map. Click “Create a Farm” to register your first farm. You will need to submit a farm to continue.',
			secondaryLabel: 'Back',
			primaryLabel: 'Create a Farm'
		}
	];

	let step = $state(0);
	let dismissed = $state(false);
	let visible = $state(false);

	const current = $derived(steps[step]);

	onMount(() => {
		visible = true;
	});

	function handlePrimary() {
		if (step === steps.length - 1) {
			goto(FARM_CREATION_ROUTE);
			return;
		}
		step += 1;
	}

	function handleSecondary() {
		step -= 1;
	}

	function handleClose() {
		dismissed = true;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dismissed = true;
		}
	}

	function popIn(_node: Element, { duration = 200 } = {}) {
		return {
			duration,
			css: (t: number) => {
				const grow = cubicOut(t);
				const scale = 0.9 + 0.1 * grow;
				const opacity = Math.min(1, t * 1.8);
				return `opacity: ${opacity}; transform: scale(${scale});`;
			}
		};
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible && !dismissed}
	<div class="overlay">
		<button class="backdrop" type="button" aria-label="Close onboarding" onclick={handleClose}
		></button>

		{#key step}
			<div class="stage" in:popIn>
				<OnboardingModal
					title={current.title}
					body={current.body}
					primaryLabel={current.primaryLabel}
					secondaryLabel={current.secondaryLabel}
					onPrimary={handlePrimary}
					onSecondary={handleSecondary}
				/>
			</div>
		{/key}
	</div>
{/if}

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
		z-index: 0;
		padding: 0;
		border: none;
		cursor: default;
		background: rgba(18, 24, 14, 0.45);
		backdrop-filter: blur(3px);
	}

	.stage {
		grid-area: 1 / 1;
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: center;
		width: 100%;
		max-width: 40em;
		transform-origin: center;
		will-change: transform, opacity;
	}
</style>
