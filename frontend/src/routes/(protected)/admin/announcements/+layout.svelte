<script lang="ts">
	import ToastHost from '$lib/components/announcements/ToastHost.svelte';

	let { children } = $props();
</script>

{@render children()}
<ToastHost />
