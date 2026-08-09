<script lang="ts">
	export let data;
</script>

{#if data.user}{/if}

<div class="new-farm-page">
	<slot />
</div>

<style>
	.new-farm-page {
		min-height: 100vh;
		background: #fff;
	}
</style>
