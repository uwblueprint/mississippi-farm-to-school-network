<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="dashboard">
	<Sidebar />
	<main class="dashboard__main">
		{@render children()}
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		align-items: flex-start;
		min-height: 100vh;
	}

	.dashboard__main {
		flex: 1;
		min-width: 0;
		/* establishes the sizing context for the cqi-based fluid spacing inside */
		container-type: inline-size;
	}
</style>
