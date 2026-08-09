<script lang="ts">
	import AnnouncementForm from '$lib/components/announcements/AnnouncementForm.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Edit Announcement</title>
</svelte:head>

<div class="announcement-page">
	<div class="page-inner">
		{#if data.announcement}
			{#key data.announcement.id}
				<AnnouncementForm heading="Edit Announcement" announcement={data.announcement} />
			{/key}
		{:else}
			<h1 class="not-found-heading">Announcement not found</h1>
			<a class="back-link" href="/admin/announcements">Back to Manage Announcements</a>
		{/if}
	</div>
</div>

<style>
	.announcement-page {
		min-height: 100dvh;
		padding: 4.75rem 1.5rem 4rem;
		background: var(--color-neutral-0);
	}

	.page-inner {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 64.375rem;
		margin: 0 auto;
	}

	.not-found-heading {
		margin: 0;
		font-family: var(--type-h1-font);
		font-weight: var(--type-h1-weight);
		font-size: var(--type-h1-size);
		line-height: 2.375rem;
		color: var(--color-text-primary);
	}

	.back-link {
		width: fit-content;
		font-family: var(--type-b3-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--type-b3-size);
		color: var(--mfsn-primary-500);
	}
</style>
