<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import OnboardingModal from './OnboardingModal.svelte';

	const FARM_CREATION_ROUTE = '/new-farm';

	interface ModalPosition {
		top?: string;
		right?: string;
		bottom?: string;
		left?: string;
		transform?: string;
	}

	interface Step {
		title: string;
		body: string;
		secondaryLabel?: string;
		primaryLabel?: string;
		position?: ModalPosition;
	}

	const ADD_FARM_STEP = 1;

	const steps: Step[] = [
		{
			title: 'Manage your profile',
			body: 'Access your settings to manage your account details.',
			primaryLabel: 'Continue'
		},
		{
			title: 'Add a Farm',
			body: 'Let’s get your farm on the map. Click “Add Farm” to register your first farm. You will need to submit a farm to continue.',
			position: { top: '5.5rem', right: '1.5rem' }
		},
		{
			title: 'Farm Cards',
			body: 'Your farm appears on the dashboard once submitted. You can see its name, location, and current status.',
			secondaryLabel: 'Back',
			primaryLabel: 'Continue'
		},
		{
			title: 'Status Badge',
			body: 'Your farm is currently under review. Once MFSN approves it, the badge will update and the farm becomes visible to schools across Mississippi.',
			secondaryLabel: 'Back',
			primaryLabel: 'Continue'
		},
		{
			title: 'You’re all set!',
			body: 'Your farm profile is submitted and in the process of being reviewed. Once approved, you will receive an email notifying the status update.',
			secondaryLabel: 'Back',
			primaryLabel: 'Done'
		}
	];

	let step = $state(0);
	let dismissed = $state(false);
	let visible = $state(false);

	const current = $derived(steps[step]);
	const stepLabel = $derived(`Step ${step + 1} of ${steps.length}`);

	onMount(() => {
		visible = true;
	});

	export function advance() {
		if (step === steps.length - 1) {
			goto(FARM_CREATION_ROUTE);
			return;
		}
		step += 1;
	}

	export function completeAddFarm() {
		if (step === ADD_FARM_STEP) {
			advance();
		}
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

	function positionStyle(position?: ModalPosition): string {
		if (!position) {
			return '';
		}
		const parts: string[] = [];
		if (position.top !== undefined) parts.push(`top: ${position.top}`);
		if (position.right !== undefined) parts.push(`right: ${position.right}`);
		if (position.bottom !== undefined) parts.push(`bottom: ${position.bottom}`);
		if (position.left !== undefined) parts.push(`left: ${position.left}`);
		parts.push(`transform: ${position.transform ?? 'none'}`);
		return parts.join('; ') + ';';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible && !dismissed}
	<div class="overlay">
		<button class="backdrop" type="button" aria-label="Close onboarding" onclick={handleClose}
		></button>

		<div
			class="modal-anchor"
			class:positioned={!!current.position}
			style={positionStyle(current.position)}
		>
			<OnboardingModal
				{stepLabel}
				title={current.title}
				body={current.body}
				primaryLabel={current.primaryLabel}
				secondaryLabel={current.secondaryLabel}
				onPrimary={advance}
				onSecondary={handleSecondary}
			/>
		</div>
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

	.modal-anchor {
		grid-area: 1 / 1;
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: center;
		width: 100%;
		max-width: 40em;
	}

	.modal-anchor.positioned {
		grid-area: auto;
		position: absolute;
		width: auto;
		max-width: calc(100vw - 3em);
	}
</style>
