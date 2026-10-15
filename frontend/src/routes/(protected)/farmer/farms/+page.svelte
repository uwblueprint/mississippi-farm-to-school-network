<script lang="ts">
	import { onMount } from 'svelte';
	import FarmCard from '$lib/components/FarmCard.svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RequestedChangesCard from '$lib/components/RequestedChangesCard.svelte';
	import ApprovedCard from '$lib/components/ApprovedCard.svelte';
	import DeletionApprovedCard from '$lib/components/DeletionApprovedCard.svelte';
	import OnboardingFlow from '$lib/components/OnboardingFlow.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { getFirebaseAuth } from '$lib/firebase';
	import { markAddFarmOpened, markOnboardingComplete, onboardingStartStep } from '$lib/onboarding';
	import { farmDisplayStatus, type FarmStatus } from '$lib/farmStatus';

	// The signed-in farmer's own farms, across all statuses (backend myFarms query).
	interface FarmListItem {
		id: string;
		farm_name: string;
		farm_address: string;
		county: string;
		status: FarmStatus;
		/** Set while the farmer's deletion request awaits admin review. */
		deletion_requested_at: string | null;
		/** The farm's cover image; null when it has none (FarmCard then shows
		 *  the default cover). */
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
				deletion_requested_at
				primary_image_url
			}
		}
	`;

	const MY_APPROVED_DELETIONS = `
		query MyApprovedFarmDeletions {
			myApprovedFarmDeletions { id farm_name }
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

	let onboardingUid = '';
	let onboardingStep = $state<number | null>(null);
	// The tour spotlights the farm that's under review (the one just submitted).
	const onboardingFarm = $derived(farms.find((farm) => farm.status === 'PENDING_APPROVAL') ?? farms[0]);

	function finishOnboarding() {
		markOnboardingComplete(onboardingUid);
		onboardingStep = null;
	}

	// Status popups shown after the farms load, one at a time: an approved
	// deletion and an approval are each shown once per farm (tracked in
	// localStorage); a rejected farm surfaces its requested changes on every
	// visit (it needs action).
	type StatusPopup =
		| { kind: 'deletion-approved'; farm: { id: string; farm_name: string } }
		| { kind: 'rejected'; farm: FarmListItem; reason: string }
		| { kind: 'approved'; farm: FarmListItem };
	let popupQueue = $state<StatusPopup[]>([]);
	const statusPopup = $derived(popupQueue[0] ?? null);

	const SEEN_APPROVED_KEY = 'mfsn:seen-approved-farms';
	const SEEN_DELETED_KEY = 'mfsn:seen-approved-deletions';

	function seenIds(key: string): string[] {
		try {
			return JSON.parse(localStorage.getItem(key) ?? '[]');
		} catch {
			return [];
		}
	}

	function markSeen(key: string, farmId: string) {
		localStorage.setItem(key, JSON.stringify([...seenIds(key), farmId]));
	}

	async function buildPopupQueue(loaded: FarmListItem[]): Promise<StatusPopup[]> {
		const queue: StatusPopup[] = [];

		try {
			const res = await gqlClient<{
				myApprovedFarmDeletions: { id: string; farm_name: string }[];
			}>(MY_APPROVED_DELETIONS);
			const seenDeleted = seenIds(SEEN_DELETED_KEY);
			for (const farm of res.myApprovedFarmDeletions) {
				if (!seenDeleted.includes(farm.id)) queue.push({ kind: 'deletion-approved', farm });
			}
		} catch {
			// the dashboard still works without the deletion notice
		}

		// A farm awaiting deletion doesn't need its other status surfaced.
		const live = loaded.filter((farm) => !farm.deletion_requested_at);

		const rejected = live.find((farm) => farm.status === 'REJECTED');
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
			queue.push({ kind: 'rejected', farm: rejected, reason });
			return queue;
		}

		const seenApproved = seenIds(SEEN_APPROVED_KEY);
		const approved = live.find(
			(farm) => farm.status === 'APPROVED' && !seenApproved.includes(farm.id)
		);
		if (approved) queue.push({ kind: 'approved', farm: approved });
		return queue;
	}

	function closePopup() {
		const popup = popupQueue[0];
		if (popup?.kind === 'approved') markSeen(SEEN_APPROVED_KEY, popup.farm.id);
		if (popup?.kind === 'deletion-approved') markSeen(SEEN_DELETED_KEY, popup.farm.id);
		popupQueue = popupQueue.slice(1);
	}

	onMount(async () => {
		try {
			const data = await gqlClient<{ myFarms: FarmListItem[] }>(MY_FARMS);
			farms = data.myFarms;
			onboardingUid = getFirebaseAuth().currentUser?.uid ?? 'anonymous';
			onboardingStep = onboardingStartStep(onboardingUid, farms.length);
			if (onboardingStep === null) popupQueue = await buildPopupQueue(farms);
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
		<ActionButton variant="outline" href="/new-farm" data-onboarding="add-farm">
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
					status={farmDisplayStatus(farm)}
					href={`/farmer/farms/${farm.id}/edit`}
				/>
			{/each}
		</div>
	{/if}
</section>

{#if onboardingStep !== null}
	<OnboardingFlow
		startStep={onboardingStep}
		farmSelector={onboardingFarm ? `.farm-card[data-farm-id="${onboardingFarm.id}"]` : undefined}
		onAddFarm={() => markAddFarmOpened(onboardingUid)}
		onComplete={finishOnboarding}
	/>
{/if}

{#if statusPopup?.kind === 'rejected'}
	{@const popup = statusPopup}
	<Modal label="Changes requested" onClose={closePopup}>
		<RequestedChangesCard
			reason={popup.reason}
			subtitle="We reviewed your application and are unable to approve it at this time"
		>
			{#snippet actions()}
				<ActionButton variant="outline-primary" onclick={closePopup}>Back</ActionButton>
				<ActionButton variant="primary" href={`/farmer/farms/${popup.farm.id}/edit`}>
					Edit Farm Details
				</ActionButton>
			{/snippet}
		</RequestedChangesCard>
	</Modal>
{:else if statusPopup?.kind === 'approved'}
	<Modal label="Application approved" onClose={closePopup}>
		<ApprovedCard />
	</Modal>
{:else if statusPopup?.kind === 'deletion-approved'}
	{@const popup = statusPopup}
	<Modal label="Deletion request approved" onClose={closePopup}>
		<DeletionApprovedCard farmName={popup.farm.farm_name}>
			{#snippet actions()}
				<ActionButton variant="primary" onclick={closePopup}>Close</ActionButton>
			{/snippet}
		</DeletionApprovedCard>
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
