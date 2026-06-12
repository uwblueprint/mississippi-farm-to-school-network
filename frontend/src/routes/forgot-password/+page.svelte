<script lang="ts">
	import '$lib/styles/auth-form.css';
	import BrandHeader from '$lib/components/BrandHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { getAuthErrorMessage, sendPasswordReset } from '$lib/auth';

	const RETRY_COOLDOWN_SECONDS = 30;

	let email = $state('');
	let statusMessage = $state('');
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

		statusMessage = '';
		isSuccess = false;
		isSubmitting = true;

		try {
			await sendPasswordReset(email.trim());
			statusMessage =
				'A password reset link has been sent to your email.\nCheck spam/junk if you do not see the email.';
			isSuccess = true;
		} catch (error) {
			statusMessage = getAuthErrorMessage(error);
		} finally {
			isSubmitting = false;
			retrySecondsRemaining = RETRY_COOLDOWN_SECONDS;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password</title>
</svelte:head>

<div class="auth-page auth-page--centered">
	<div class="auth-stack">
		<BrandHeader />

		<div class="auth-form-wrapper auth-form-wrapper--wide">
			<h1 class="auth-heading">Forgot Password?</h1>
			<p class="auth-subtitle auth-subtitle--left">
				We'll send you an email to reset your password.
			</p>

			<form class="auth-form" onsubmit={handleSubmit}>
				<TextInput
					label="Email Address"
					type="email"
					name="email"
					autocomplete="email"
					placeholder="farmer@gmail.com"
					required
					bind:value={email}
				/>

				{#if statusMessage}
					<p
						class="auth-status {isSuccess ? 'auth-status--success' : 'auth-status--error'}"
						role={isSuccess ? 'status' : 'alert'}
					>
						{statusMessage}
					</p>
				{/if}

				<Button
					type="submit"
					disabled={isSubmitting || retrySecondsRemaining > 0}
					label={buttonLabel}
				/>
			</form>

			<p class="auth-footer">
				<a class="auth-return-link" href="/login"><span aria-hidden="true">‹</span> Return to Login</a>
			</p>
		</div>
	</div>
</div>
