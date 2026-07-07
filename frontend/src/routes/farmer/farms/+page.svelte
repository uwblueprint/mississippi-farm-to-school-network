<script lang="ts">
	import FarmCard from '$lib/components/FarmCard.svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import type { FarmStatus } from '$lib/farmStatus';

	// Sample farms (varied name/address lengths + images) for testing responsive behavior.
	// Shape mirrors a backend FarmDTO mapped to display fields.
	const farms: {
		id: string;
		title: string;
		address: string;
		owner: string;
		status: FarmStatus;
		image: string;
	}[] = [
		{
			id: 'two-brooks',
			title: 'Two Brooks Farm',
			address: '309 W Lampton St, Mound Bayou, MS 38762',
			owner: 'Antionette Turner',
			status: 'APPROVED',
			image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900'
		},
		{
			id: 'whispering-pines',
			title: 'Whispering Pines Organic Family Farm & Orchard',
			address: '12450 County Road 47 North, Hattiesburg, MS 39402',
			owner: 'Reginald Booker',
			status: 'PENDING_APPROVAL',
			image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900'
		},
		{
			id: 'lilas-greens',
			title: 'Lila’s Greens',
			address: '5 Oak Ave, Tupelo, MS',
			owner: 'Lila Okafor',
			status: 'APPROVED',
			image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900'
		},
		{
			id: 'delta-roots',
			title: 'Delta Roots Co-op',
			address: '88 Levee Rd, Greenville, MS 38701',
			owner: 'Marcus & Dawn Pleasant',
			status: 'REJECTED',
			image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=900'
		}
	];

	// Placeholder until a backend archive mutation exists.
	function archive(id: string) {
		console.log('archive farm', id);
	}
</script>

<svelte:head>
	<title>Farms</title>
</svelte:head>

<section class="farms-page">
	<header class="farms-header">
		<h1 class="farms-title">Farms</h1>
		<ActionButton variant="outline" href="/new-farm">
			{#snippet iconLeft()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M12 5V19M5 12H19" stroke="#696C78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
			Add farm
		</ActionButton>
	</header>

	<div class="farm-grid">
		{#each farms as farm (farm.id)}
			<FarmCard
				id={farm.id}
				imageUrl={farm.image}
				imageAlt={farm.title}
				title={farm.title}
				subtitle={farm.address}
				subtitle2={farm.owner}
				status={farm.status}
				viewHref={`/farmer/farms/${farm.id}`}
				editHref={`/farmer/farms/${farm.id}/edit`}
				onArchive={() => archive(farm.id)}
			/>
		{/each}
	</div>
</section>

<style>
	.farms-page {
		/* side padding scales with the main area: 110px at the 1600px Figma width,
		   easing down to 32px on small screens (8cqi ≈ 110px when main ≈ 1350px). */
		padding: 60px clamp(32px, 8cqi, 110px);
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.farms-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.farms-title {
		flex-shrink: 0;
		width: 100px;
		height: 34px;
		color: #000;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 32px;
		font-style: normal;
		font-weight: 500;
		line-height: normal;
	}

	.farm-grid {
		display: grid;
		/* 1fr max (not a fixed 486px) lets the grid form an extra column and gently
		   shrink the cards to share the row; each card's own max-width: 486px caps it. */
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
		/* inter-card gap scales in step with the side padding: 92px at the Figma
		   width, easing to 24px on small screens (6.8cqi ≈ 92px when main ≈ 1350px). */
		gap: clamp(24px, 6.8cqi, 92px);
		align-items: start; /* don't stretch shorter cards to match a taller one */
	}
</style>
