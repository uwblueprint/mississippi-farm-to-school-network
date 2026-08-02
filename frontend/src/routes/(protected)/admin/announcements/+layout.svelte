<script lang="ts">
	import ToastHost from '$lib/components/announcements/ToastHost.svelte';

	let { children } = $props();

	$effect(() => {
		const root = document.documentElement;
		root.classList.add('announcements-hide-scrollbar');
		return () => root.classList.remove('announcements-hide-scrollbar');
	});
</script>

{@render children()}
<ToastHost />

<style>
	:global(html.announcements-hide-scrollbar) {
		scrollbar-width: none;
	}

	:global(html.announcements-hide-scrollbar::-webkit-scrollbar) {
		display: none;
	}
</style>
