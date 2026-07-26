<script lang="ts">
	import OnboardingFlow from '$lib/components/OnboardingFlow.svelte';

	let flow = $state<ReturnType<typeof OnboardingFlow>>();
</script>

<svelte:head>
	<title>Farmer</title>
</svelte:head>

<section class="space-y-4 p-6 md:p-10">
	<h1 class="text-3xl font-bold text-surface-950-50">FARMER PAGE</h1>
</section>

<button class="add-farm" type="button" onclick={() => flow?.completeAddFarm()}>Add Farm</button>

<OnboardingFlow bind:this={flow} />

<style>
	.add-farm {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 60;
		font-family: 'DM Sans', sans-serif;
		font-size: 1rem;
		font-weight: 500;
		padding: 0.75em 1.875em;
		color: #ffffff;
		background: var(--mfsn-primary);
		border: 2px solid var(--mfsn-primary);
		border-radius: 0.75em;
		cursor: pointer;
		transition:
			background-color 150ms ease,
			border-color 150ms ease;
	}

	.add-farm:hover {
		background: var(--mfsn-primary-hover);
		border-color: var(--mfsn-primary-hover);
	}
</style>
