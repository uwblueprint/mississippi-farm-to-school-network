<script lang="ts">
	import { onMount } from 'svelte';
	import FarmCard from '$lib/components/FarmCard.svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RequestedChangesCard from '$lib/components/RequestedChangesCard.svelte';
	import ApprovedCard from '$lib/components/ApprovedCard.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import type { FarmStatus } from '$lib/farmStatus';

	// The signed-in farmer's own farms, across all statuses (backend myFarms query).
	interface FarmListItem {
		id: string;
		farm_name: string;
		farm_address: string;
		county: string;
		status: FarmStatus;
		/** The farm's first uploaded image; null when it has none (FarmCard then
		 *  renders an empty grey block). */
		primary_image_url: string | null;
	}

	const MY_FARMS = `
		query MyFarms {
			myFarms {
				id
				farm_name
				farm_address
				county
				status
				primary_image_url
			}
		}
	`;

	const LATEST_REJECTION = `
		query LatestActiveFarmRejection($farmId: ID!) {
			latestActiveFarmRejection(farmId: $farmId) { rejection_reason }
		}
	`;

	let farms = $state<FarmListItem[]>([]);
	let loading = $state(true);
	let errorMessage = $state('');

	// Status popup shown after the farms load: a rejected farm surfaces its
	// requested changes on every visit (it needs action); an approval is
	// celebrated once per farm (tracked in localStorage).
	type StatusPopup =
		| { kind: 'rejected'; farm: FarmListItem; reason: string }
		| { kind: 'approved'; farm: FarmListItem };
	let statusPopup = $state<StatusPopup | null>(null);

	const SEEN_APPROVED_KEY = 'mfsn:seen-approved-farms';

	function seenApprovedIds(): string[] {
		try {
			return JSON.parse(localStorage.getItem(SEEN_APPROVED_KEY) ?? '[]');
		} catch {
			return [];
		}
	}

	async function pickStatusPopup(loaded: FarmListItem[]) {
		const rejected = loaded.find((farm) => farm.status === 'REJECTED');
		if (rejected) {
			let reason = 'Please review your farm details and resubmit your application.';
			try {
				const res = await gqlClient<{
					latestActiveFarmRejection: { rejection_reason: string } | null;
				}>(LATEST_REJECTION, { farmId: rejected.id });
				reason = res.latestActiveFarmRejection?.rejection_reason ?? reason;
			} catch {
				// popup still shows with the generic reason
			}
			statusPopup = { kind: 'rejected', farm: rejected, reason };
			return;
		}

		const seen = seenApprovedIds();
		const approved = loaded.find((farm) => farm.status === 'APPROVED' && !seen.includes(farm.id));
		if (approved) statusPopup = { kind: 'approved', farm: approved };
	}

	function closeApprovedPopup(farmId: string) {
		localStorage.setItem(SEEN_APPROVED_KEY, JSON.stringify([...seenApprovedIds(), farmId]));
		statusPopup = null;
	}

	onMount(async () => {
		try {
			const data = await gqlClient<{ myFarms: FarmListItem[] }>(MY_FARMS);
			farms = data.myFarms;
			await pickStatusPopup(farms);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to load your farms.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Farms</title>
</svelte:head>

<section class="farms-page">
	<header class="farms-header">
		<h1 class="farms-title">Farms</h1>
		<ActionButton variant="outline" href="/new-farm">
			{#snippet iconLeft()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M12 5V19M5 12H19"
						stroke="#696C78"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/snippet}
			Add farm
		</ActionButton>
	</header>

	{#if loading}
		<p class="farms-message">Loading your farms…</p>
	{:else if errorMessage}
		<p class="farms-message farms-message--error" role="alert">{errorMessage}</p>
	{:else if farms.length === 0}
		<p class="farms-message">You don't have any farms yet.</p>
	{:else}
		<div class="farm-grid">
			{#each farms as farm (farm.id)}
				<FarmCard
					id={farm.id}
					imageUrl={farm.primary_image_url}
					imageAlt={farm.farm_name}
					title={farm.farm_name}
					subtitle={farm.farm_address}
					subtitle2={farm.county}
					status={farm.status}
					href={`/farmer/farms/${farm.id}/edit`}
				/>
			{/each}
		</div>
	{/if}
</section>

{#if statusPopup?.kind === 'rejected'}
	{@const popup = statusPopup}
	<Modal label="Changes requested" onClose={() => (statusPopup = null)}>
		<RequestedChangesCard
			reason={popup.reason}
			subtitle="We reviewed your application and are unable to approve it at this time"
		>
			{#snippet actions()}
				<ActionButton variant="outline-primary" onclick={() => (statusPopup = null)}>
					Back
				</ActionButton>
				<ActionButton variant="primary" href={`/farmer/farms/${popup.farm.id}/edit`}>
					Edit Farm Details
				</ActionButton>
			{/snippet}
		</RequestedChangesCard>
	</Modal>
{:else if statusPopup?.kind === 'approved'}
	{@const popup = statusPopup}
	<Modal label="Application approved" onClose={() => closeApprovedPopup(popup.farm.id)}>
		<ApprovedCard />
	</Modal>
{/if}

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
		color: #000;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 32px;
		font-style: normal;
		font-weight: 500;
		line-height: normal;
	}

	.farms-message {
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 18px;
		color: #696c78;
		margin: 0;
	}

	.farms-message--error {
		color: #c4341f;
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
