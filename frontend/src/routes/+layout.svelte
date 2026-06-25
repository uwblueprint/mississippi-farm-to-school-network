<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '@fontsource-variable/figtree';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
