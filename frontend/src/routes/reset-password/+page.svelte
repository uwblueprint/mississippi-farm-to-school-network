<script lang="ts">
	import '$lib/styles/auth/auth-form.css';
	import AuthPageLayout from '$lib/components/auth/AuthPageLayout.svelte';
	import AuthStatusMessage from '$lib/components/auth/AuthStatusMessage.svelte';
	import Button from '$lib/components/Button.svelte';
	import PasswordRequirements from '$lib/components/auth/PasswordRequirements.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { isPasswordValid } from '$lib/auth';

	let email = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let errorMessage = $state('');

	const passwordValid = $derived(isPasswordValid(newPassword));
	const passwordsMatch = $derived(confirmPassword.length > 0 && newPassword === confirmPassword);
	const confirmPasswordError = $derived(
		confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match.' : ''
	);
	const canSubmit = $derived(email.trim().length > 0 && passwordValid && passwordsMatch);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!canSubmit) {
			return;
		}

		errorMessage = '';
		// Password reset action handling will be wired here when we move off Firebase's hosted pages.
	}
</script>

<svelte:head>
	<title>Reset Password</title>
</svelte:head>

<AuthPageLayout>
	<div class="auth-form-section">
		<div class="auth-title-group">
			<h1 class="auth-title">Reset Password</h1>
		</div>

		<form id="reset-password-form" class="auth-form" onsubmit={handleSubmit}>
			<TextInput
				label="Email Address"
				type="email"
				name="email"
				autocomplete="email"
				required
				bind:value={email}
			/>

			<TextInput
				label="New Password"
				type="password"
				name="new-password"
				autocomplete="new-password"
				placeholder="Enter Password"
				required
				showPasswordToggle
				bind:value={newPassword}
			/>

			<TextInput
				label="Re-enter Password"
				type="password"
				name="confirm-password"
				autocomplete="new-password"
				placeholder="Enter Password"
				required
				showPasswordToggle
				bind:value={confirmPassword}
				error={confirmPasswordError}
			/>

			<PasswordRequirements password={newPassword} />

			{#if errorMessage}
				<AuthStatusMessage message={errorMessage} />
			{/if}
		</form>
	</div>

	{#snippet actions()}
		<Button
			type="submit"
			form="reset-password-form"
			disabled={!canSubmit}
			label="Change Password"
		/>
	{/snippet}
</AuthPageLayout>
