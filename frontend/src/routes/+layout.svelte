<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { subscribeAuthTokenCookie } from '$lib/auth';

	let { children } = $props();

	onMount(() => {
		return subscribeAuthTokenCookie();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
