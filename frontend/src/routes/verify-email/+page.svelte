<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/auth/auth-form.css';
	import AuthPageLayout from '$lib/components/auth/AuthPageLayout.svelte';
	import AuthStatusMessage from '$lib/components/auth/AuthStatusMessage.svelte';
	import { goto } from '$app/navigation';
	import {
		getAuthErrorMessage,
		getPostAuthDestination,
		sendEmailVerificationHandler
	} from '$lib/auth';
	import { getFirebaseAuth } from '$lib/firebase';
	import { onAuthStateChanged } from 'firebase/auth';

	const RESEND_COOLDOWN_SECONDS = 30;

	let email = $state('');
	let isReady = $state(false);
	let isSending = $state(false);
	let resendSecondsRemaining = $state(0);
	let errorMessage = $state('');
	let isSuccess = $state(false);
	let initialSendStarted = false;

	const resendLabel = $derived(
		isSending
			? 'Sending…'
			: resendSecondsRemaining > 0
				? `Resend in ${resendSecondsRemaining}s`
				: 'Resend Link'
	);

	$effect(() => {
		if (resendSecondsRemaining <= 0) return;

		const interval = setInterval(() => {
			resendSecondsRemaining -= 1;
		}, 1000);

		return () => clearInterval(interval);
	});

	async function sendEmail() {
		if (isSending || resendSecondsRemaining > 0) {
			return;
		}

		errorMessage = '';
		isSuccess = false;
		isSending = true;

		try {
			await sendEmailVerificationHandler();
			isSuccess = true;
			resendSecondsRemaining = RESEND_COOLDOWN_SECONDS;
		} catch (error) {
			errorMessage = getAuthErrorMessage(error);
		} finally {
			isSending = false;
		}
	}

	onMount(() => {
		const auth = getFirebaseAuth();

		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				goto('/login');
				return;
			}

			if (user.emailVerified) {
				goto(getPostAuthDestination(user.email ?? '', 'verified'));
				return;
			}

			email = user.email ?? '';
			isReady = true;

			if (!initialSendStarted) {
				initialSendStarted = true;
				void sendEmail();
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Verify Email</title>
</svelte:head>

<AuthPageLayout>
	{#if isReady}
		<div class="auth-title-group auth-title-group--centered">
			<h1 class="auth-title auth-title--centered">Verify Your Email Address</h1>
			<div class="verify-email-line">
				<span class="auth-body-text">We've sent a verification email to:</span>
				<span class="auth-body-text auth-body-text--strong">{email}</span>
			</div>
		</div>

		<div class="verify-instructions">
			<p class="auth-body-text">Click the link to complete the verification process.</p>
			<p class="auth-body-text">Check spam/junk if you do not see the email.</p>
		</div>

		{#if errorMessage}
			<AuthStatusMessage message={errorMessage} variant={isSuccess ? 'success' : 'error'} />
		{/if}

		<div class="verify-resend-row">
			<span class="auth-body-text auth-body-text--muted">Didn't receive the email?</span>
			<button
				type="button"
				class="verify-resend-btn"
				disabled={isSending || resendSecondsRemaining > 0}
				onclick={() => void sendEmail()}
			>
				{resendLabel}
			</button>
		</div>
	{/if}
</AuthPageLayout>
