<script lang="ts">
	import type { Snippet } from 'svelte';
	import PromoBanner from '$lib/components/PromoBanner.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
</script>

{#snippet section(title: string, body: Snippet)}
	<section class="space-y-4">
		<h2 class="text-xl font-semibold text-surface-950-50">{title}</h2>
		{@render body()}
	</section>
{/snippet}

<svelte:head>
	<title>Components</title>
</svelte:head>

<div class="min-h-screen bg-white p-6 md:p-10">
	<a class="btn preset-outlined-surface-300-700" href="/">jk go home</a>

	<div class="mx-auto mt-8 max-w-5xl space-y-14">
		<header class="space-y-2">
			<h1 class="text-3xl font-bold text-surface-950-50">Components</h1>
			<p class="text-surface-600-400">Showcase for the project's reusable components.</p>
		</header>

		{#snippet promoBody()}
			<div class="space-y-8">
				<div class="space-y-2">
					<p class="text-sm text-surface-600-400">Hover to expand</p>
					<PromoBanner />
				</div>
				<div class="space-y-2">
					<p class="text-sm text-surface-600-400">Expanded (static)</p>
					<PromoBanner expanded={true} />
				</div>
			</div>
		{/snippet}
		{@render section('Promo Banner', promoBody)}

		{#snippet buttonBody()}
			<div class="space-y-3">
				<div class="flex flex-wrap gap-3">
					<Button class="preset-filled-primary-500">Primary</Button>
					<Button class="preset-filled-secondary-500">Secondary</Button>
					<Button class="preset-filled-surface-500">Neutral</Button>
					<Button class="preset-tonal-primary">Tonal Primary</Button>
					<Button class="preset-outlined-primary-500">Outlined Primary</Button>
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<Button class="preset-filled-primary-500 btn-sm">Small</Button>
					<Button class="preset-filled-primary-500 btn-base">Base</Button>
					<Button class="preset-filled-primary-500 btn-lg">Large</Button>
				</div>
			</div>
		{/snippet}
		{@render section('Button', buttonBody)}

		{#snippet cardBody()}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card class="preset-filled-primary-500 p-4 text-primary-contrast-500">
					<p class="font-medium">Filled primary</p>
					<p class="text-sm opacity-90">preset-filled-primary-500</p>
				</Card>
				<Card class="preset-tonal-secondary p-4">
					<p class="font-medium text-surface-950-50">Tonal secondary</p>
					<p class="text-sm text-surface-600-400">preset-tonal-secondary</p>
				</Card>
				<Card class="preset-outlined-surface-200-800 p-4">
					<p class="font-medium text-surface-950-50">Outlined neutral</p>
					<p class="text-sm text-surface-600-400">preset-outlined-surface-200-800</p>
				</Card>
			</div>
		{/snippet}
		{@render section('Card', cardBody)}

		{#snippet badgeBody()}
			<div class="flex flex-wrap gap-2">
				<Badge class="preset-filled-primary-500">Primary</Badge>
				<Badge class="preset-filled-secondary-500">Secondary</Badge>
				<Badge class="preset-tonal-success">Success</Badge>
				<Badge class="preset-tonal-warning">Warning</Badge>
				<Badge class="preset-tonal-error">Error</Badge>
				<Badge class="preset-outlined-surface-300-700">Neutral</Badge>
			</div>
		{/snippet}
		{@render section('Badge', badgeBody)}
	</div>
</div>
