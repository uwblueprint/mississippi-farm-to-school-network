<script lang="ts">
	import type { Announcement } from '$lib/types/announcement';
	import { statusOf } from '$lib/utils/announcement-dates';
	import AnnouncementCard from './AnnouncementCard.svelte';
	import chevronDownIcon from '$lib/assets/announcements/chevron-down.svg';

	let { announcements }: { announcements: Announcement[] } = $props();

	let expiredOpen = $state(true);

	const sorted = $derived(
		[...announcements].sort((a, b) => a.startDate.localeCompare(b.startDate))
	);
	const active = $derived(sorted.filter((a) => statusOf(a) === 'active'));
	const upcoming = $derived(sorted.filter((a) => statusOf(a) === 'scheduled'));
	const expired = $derived(
		sorted
			.filter((a) => statusOf(a) === 'expired')
			.sort((a, b) => b.endDate.localeCompare(a.endDate))
	);
</script>

<div class="sections">
	<section class="section">
		<h2 class="section-header">
			Active Announcements <span class="section-count">{active.length}</span>
		</h2>
		{#each active as announcement (announcement.id)}
			<AnnouncementCard {announcement} />
		{/each}
	</section>

	<section class="section">
		<h2 class="section-header">
			Upcoming Announcements <span class="section-count">{upcoming.length}</span>
		</h2>
		{#each upcoming as announcement (announcement.id)}
			<AnnouncementCard {announcement} />
		{/each}
	</section>

	<section class="section">
		<div class="section-toggle-row">
			<h2 class="section-header">Expired Announcements</h2>
			<button
				class="section-toggle"
				type="button"
				aria-expanded={expiredOpen}
				aria-label="Toggle expired announcements"
				onclick={() => (expiredOpen = !expiredOpen)}
			>
				<img class:flipped={expiredOpen} src={chevronDownIcon} alt="" />
			</button>
		</div>
		{#if expiredOpen}
			{#each expired as announcement (announcement.id)}
				<AnnouncementCard {announcement} />
			{/each}
		{/if}
	</section>
</div>

<style>
	.sections {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		width: 100%;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
		font-family: var(--type-h2-font);
		font-weight: var(--type-h2-weight);
		font-size: var(--type-h2-size);
		line-height: 2.125rem;
		color: #000000;
	}

	.section-count {
		color: var(--color-text-disabled);
	}

	.section-toggle-row {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.section-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.section-toggle img {
		display: block;
		width: 14px;
		height: 8px;
		transition: transform 200ms ease;
	}

	.section-toggle img.flipped {
		transform: rotate(180deg);
	}
</style>
