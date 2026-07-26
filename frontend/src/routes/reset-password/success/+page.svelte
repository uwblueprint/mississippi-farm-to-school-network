<script lang="ts">
	import AuthSuccessScreen from '$lib/components/auth/AuthSuccessScreen.svelte';
</script>

<svelte:head>
	<title>Password Changed</title>
</svelte:head>

<AuthSuccessScreen
	heading="Password Changed."
	message="Your password has been successfully changed"
	buttonLabel="Return to Login"
	buttonHref="/login"
/>
