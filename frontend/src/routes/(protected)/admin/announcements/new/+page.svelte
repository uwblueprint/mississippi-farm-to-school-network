<script lang="ts">
	import AnnouncementForm from '$lib/components/announcements/AnnouncementForm.svelte';
</script>

<svelte:head>
	<title>Create Announcement</title>
</svelte:head>

<div class="announcement-page">
	<div class="page-inner">
		<AnnouncementForm heading="Create Announcement" />
	</div>
</div>

<style>
	.announcement-page {
		flex: 1;
		min-width: 0;
		min-height: 100dvh;
		padding: 4.75rem 1.5rem 4rem;
		background: var(--color-neutral-0);
	}

	.page-inner {
		max-width: 64.375rem;
		margin: 0 auto;
	}
</style>
