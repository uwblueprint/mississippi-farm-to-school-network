<script lang="ts">
	import { scale } from 'svelte/transition';
	import MegaphoneIcon from '$lib/components/map/MegaphoneIcon.svelte';
	import { announcementBar, restoreAnnouncements } from '$lib/state/announcementBar.svelte';

	const count = $derived(announcementBar.items.length);
</script>

{#if announcementBar.minimized}
	<button
		type="button"
		class="announcement-launcher"
		aria-label={count > 1 ? `Show ${count} announcements` : 'Show announcement'}
		title="Show announcements"
		onclick={restoreAnnouncements}
		transition:scale={{ duration: 180, start: 0.6 }}
	>
		<MegaphoneIcon size={18} />
		{#if count > 1}
			<span class="announcement-launcher__badge" aria-hidden="true">{count}</span>
		{/if}
	</button>
{/if}

<style>
	/* sized and bordered to sit flush beside the 40px search input */
	.announcement-launcher {
		position: relative;
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 1.3px solid #d3d5de;
		border-radius: 8px;
		background: #fff;
		color: #587244;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.announcement-launcher:hover {
		background: #f2f5ee;
		border-color: #93a480;
	}

	.announcement-launcher:focus-visible {
		outline: 2px solid #587244;
		outline-offset: 2px;
	}

	.announcement-launcher__badge {
		position: absolute;
		top: -6px;
		right: -6px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: #587244;
		color: #fff;
		font-family: 'DM Sans', sans-serif;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 18px;
		box-sizing: border-box;
	}
</style>
