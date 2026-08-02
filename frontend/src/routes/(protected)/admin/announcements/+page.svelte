<script lang="ts">
	import AnnouncementsCalendarView from '$lib/components/announcements/AnnouncementsCalendarView.svelte';
	import AnnouncementsListView from '$lib/components/announcements/AnnouncementsListView.svelte';
	import ViewTogglePill from '$lib/components/announcements/ViewTogglePill.svelte';
	import plusIcon from '$lib/assets/announcements/plus-white.svg';

	let { data } = $props();

	let view = $state<'list' | 'calendar'>('list');
</script>

<svelte:head>
	<title>Manage Announcements</title>
</svelte:head>

<div class="announcements-page">
	<div class="page-inner">
		<h1 class="page-heading">Manage Announcements</h1>

		<div class="page-toolbar">
			<ViewTogglePill {view} onchange={(next) => (view = next)} />
			<a class="new-announcement-button" href="/admin/announcements/new">
				New Announcement
				<img src={plusIcon} alt="" />
			</a>
		</div>

		{#if view === 'list'}
			<AnnouncementsListView announcements={data.announcements} />
		{:else}
			<AnnouncementsCalendarView announcements={data.announcements} />
		{/if}
	</div>
</div>

<style>
	.announcements-page {
		min-height: 100dvh;
		padding: 3.125rem 1.5rem 4rem;
		background: var(--color-neutral-0);
	}

	.page-inner {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 64.375rem;
		margin: 0 auto;
	}

	.page-heading {
		margin: 0;
		font-family: var(--type-h1-font);
		font-weight: var(--type-h1-weight);
		font-size: var(--type-h1-size);
		line-height: 2.375rem;
		color: var(--color-text-primary);
	}

	.page-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.new-announcement-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		height: 2.5rem;
		padding: 0.5rem 1rem;
		background: var(--mfsn-primary-400);
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		color: #ffffff;
		text-decoration: none;
	}

	.new-announcement-button:hover {
		background: var(--mfsn-primary-hover);
	}

	.new-announcement-button img {
		display: block;
		width: 13.67px;
		height: 13.67px;
	}
</style>
