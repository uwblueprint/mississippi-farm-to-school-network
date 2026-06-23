<script lang="ts">
	import AuthSuccessScreen from '$lib/components/auth/AuthSuccessScreen.svelte';
</script>

<svelte:head>
	<title>Email Verified</title>
</svelte:head>

<AuthSuccessScreen
	heading="Email Verified"
	message="Your account has been successfully verified."
	buttonLabel="Continue to Login"
	buttonHref="/login"
/>
