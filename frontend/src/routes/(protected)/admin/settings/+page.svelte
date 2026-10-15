<script lang="ts">
	import ProfileSettings from '$lib/components/ProfileSettings.svelte';
</script>

<main class="admin-settings">
	<ProfileSettings />
</main>

<style>
	.admin-settings {
		flex: 1;
		min-width: 0;
		container-type: inline-size;
	}
</style>
