<script lang="ts">
	import '$lib/styles/auth/auth-form.css';
	import AuthPageLayout from '$lib/components/auth/AuthPageLayout.svelte';
	import AuthStatusMessage from '$lib/components/auth/AuthStatusMessage.svelte';
	import Button from '$lib/components/Button.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { getAuthErrorMessage, sendPasswordResetEmailHandler } from '$lib/auth';

	const RETRY_COOLDOWN_SECONDS = 30;

	let email = $state('');
	let errorMessage = $state('');
	let isSuccess = $state(false);
	let isSubmitting = $state(false);
	let retrySecondsRemaining = $state(0);

	const buttonLabel = $derived(
		isSubmitting
			? 'Sending…'
			: retrySecondsRemaining > 0
				? `Retry in ${retrySecondsRemaining}s`
				: 'Send Email'
	);

	$effect(() => {
		if (retrySecondsRemaining <= 0) return;

		const interval = setInterval(() => {
			retrySecondsRemaining -= 1;
		}, 1000);

		return () => clearInterval(interval);
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (retrySecondsRemaining > 0 || isSubmitting) {
			return;
		}

		errorMessage = '';
		isSubmitting = true;

		try {
			await sendPasswordResetEmailHandler(email.trim());
			isSuccess = true;
		} catch (error) {
			isSuccess = false;
			errorMessage = getAuthErrorMessage(error);
		} finally {
			isSubmitting = false;
			retrySecondsRemaining = RETRY_COOLDOWN_SECONDS;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password</title>
</svelte:head>

<AuthPageLayout>
	<div class="auth-form-section">
		<div class="auth-title-group">
			<h1 class="auth-title">Forgot Password?</h1>
			<p class="auth-body-text">We'll send you an email to reset your password.</p>
		</div>

		<form id="forgot-password-form" class="auth-form" onsubmit={handleSubmit}>
			<TextInput
				label="Email Address"
				type="email"
				name="email"
				autocomplete="email"
				placeholder="farmer@gmail.com"
				required
				bind:value={email}
			/>

			{#if errorMessage}
				<AuthStatusMessage message={errorMessage} />
			{/if}
		</form>
	</div>

	{#snippet actions()}
		{#if isSuccess}
			<p class="auth-body-text">
				A password reset link has been sent to your email. Check spam/junk if you do not see the
				email.
			</p>
		{/if}

		<Button
			type="submit"
			form="forgot-password-form"
			disabled={isSubmitting || retrySecondsRemaining > 0}
			label={buttonLabel}
		/>

		<a class="auth-return-link" href="/login">
			<!-- chevron (<) -->
			<svg class="auth-return-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M15 18L9 12L15 6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Return to Login
		</a>
	{/snippet}
</AuthPageLayout>
