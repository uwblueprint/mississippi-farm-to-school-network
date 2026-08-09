<script lang="ts">
	import type { AnnouncementStatus } from '$lib/types/announcement';

	let { status }: { status: AnnouncementStatus } = $props();

	const labels: Record<AnnouncementStatus, string> = {
		active: 'Active',
		scheduled: 'Scheduled',
		expired: 'Expired'
	};
</script>

<span class="status-tag status-tag--{status}">{labels[status]}</span>

<style>
	.status-tag {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem 0.75rem;
		border-radius: 1.4375rem;
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-regular);
		font-size: 0.75rem;
		line-height: 1rem;
	}

	.status-tag--active {
		background: var(--mfsn-status-active-bg);
		color: var(--mfsn-status-active-text);
	}

	.status-tag--scheduled {
		background: var(--mfsn-status-scheduled-bg);
		color: var(--mfsn-status-scheduled-text);
	}

	.status-tag--expired {
		background: var(--mfsn-status-expired-bg);
		color: var(--mfsn-status-expired-text);
	}
</style>
