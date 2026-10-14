<script lang="ts">
	let { children } = $props();

	$effect(() => {
		const root = document.documentElement;
		root.classList.add('announcements-hide-scrollbar');
		return () => root.classList.remove('announcements-hide-scrollbar');
	});
</script>

{@render children()}

<style>
	:global(html.announcements-hide-scrollbar) {
		scrollbar-width: none;
	}

	:global(html.announcements-hide-scrollbar::-webkit-scrollbar) {
		display: none;
	}
</style>
