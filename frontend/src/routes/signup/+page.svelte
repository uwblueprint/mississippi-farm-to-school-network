<script lang="ts">
	import '$lib/styles/auth/auth-form.css';
	import BrandHeader from '$lib/components/BrandHeader.svelte';
	import AuthStatusMessage from '$lib/components/auth/AuthStatusMessage.svelte';
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { goto } from '$app/navigation';
	import PasswordRequirements from '$lib/components/auth/PasswordRequirements.svelte';
	import {
		EMAIL_ALREADY_IN_USE_ERROR,
		getAuthErrorMessage,
		isEmailAlreadyInUseError,
		isEmailValid,
		isPasswordValid,
		signupWithEmail
	} from '$lib/auth';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let showEmailExistsActions = $state(false);
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	const passwordValid = $derived(isPasswordValid(password));
	const canSubmit = $derived(passwordValid && email.trim().length > 0 && !isSubmitting);

	function clearErrors() {
		emailError = '';
		showEmailExistsActions = false;
		errorMessage = '';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clearErrors();

		const trimmedEmail = email.trim();

		if (!isEmailValid(trimmedEmail)) {
			errorMessage = 'Please enter a valid email address.';
			return;
		}

		if (!passwordValid) {
			errorMessage = 'Please meet all password requirements.';
			return;
		}

		isSubmitting = true;

		try {
			await signupWithEmail(trimmedEmail, password);
			await goto('/verify-email');
		} catch (error) {
			if (isEmailAlreadyInUseError(error)) {
				emailError = EMAIL_ALREADY_IN_USE_ERROR;
				showEmailExistsActions = true;
			} else {
				errorMessage = getAuthErrorMessage(error);
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up</title>
</svelte:head>

<div class="auth-page--signup">
	<div class="auth-content">
		<div class="auth-main auth-main--signup">
			<div class="signup-stack">
				<BrandHeader title="" />

				<div class="signup-content">
					<div class="signup-header">
						<h1 class="signup-heading">Create Your Account</h1>
						<p class="signup-subtitle">Add your farm to the map.</p>
					</div>

					<div class="signup-form-section">
						<form class="auth-form" novalidate onsubmit={handleSubmit}>
							<TextInput
								label="Email Address"
								type="email"
								name="email"
								autocomplete="email"
								placeholder="farmer@gmail.com"
								required
								bind:value={email}
								error={emailError}
							>
								{#snippet errorCTA()}
									{#if showEmailExistsActions}
										<Link href="/login" label="Log in" />
										·
										<Link href="/forgot-password" label="Reset Password" />
									{/if}
								{/snippet}
							</TextInput>

							<div class="password-field-group">
								<TextInput
									label="Password"
									type="password"
									name="password"
									autocomplete="new-password"
									placeholder="Enter Password"
									required
									showPasswordToggle
									bind:value={password}
								/>

								<PasswordRequirements {password} />
							</div>

							{#if errorMessage}
								<AuthStatusMessage message={errorMessage} />
							{/if}

							<div class="auth-form-actions">
								<Button
									type="submit"
									disabled={!canSubmit}
									label={isSubmitting ? 'Continuing…' : 'Continue'}
								/>

								<p class="auth-footer auth-footer--signup">
									<span>Have an account?</span>
									<Link href="/login" label="Log in" />
								</p>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>

		<div class="auth-image-panel" aria-hidden="true">
			<img class="auth-image" src="/images/farm-landscape.png" alt="" />
		</div>
	</div>
</div>
