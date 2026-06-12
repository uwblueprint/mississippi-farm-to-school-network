<script lang="ts">
	import '$lib/styles/auth-form.css';
	import BrandHeader from '$lib/components/BrandHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { goto } from '$app/navigation';
	import {
		EMAIL_ALREADY_IN_USE_ERROR,
		getAuthErrorMessage,
		isAdminEmail,
		isEmailAlreadyInUseError,
		isEmailValid,
		isPasswordValid,
		PASSWORD_REQUIREMENTS,
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
			await goto(isAdminEmail(trimmedEmail) ? '/admin' : '/onboarding');
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

<div class="auth-page">
	<div class="auth-content">
		<div class="auth-main">
			<BrandHeader title="" />

			<div class="auth-form-wrapper">
				<h1 class="auth-heading auth-heading--centered">Create Your Account</h1>
				<p class="auth-subtitle">Add your farm to the map.</p>

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

					<TextInput
						label="Password"
						type="password"
						name="password"
						autocomplete="new-password"
						placeholder="Enter Password"
						required
						bind:value={password}
					/>

					<div class="auth-requirements-box">
						<p class="auth-requirements-title">Your password must contain:</p>
						<ul class="auth-requirements" aria-label="Password requirements">
							{#each PASSWORD_REQUIREMENTS as requirement (requirement.id)}
								{@const met = requirement.test(password)}
								<li class="auth-requirement" class:auth-requirement--met={met}>
									<span aria-hidden="true">{met ? '✓' : '✕'}</span>
									{requirement.label}
								</li>
							{/each}
						</ul>
					</div>

					{#if errorMessage}
						<p class="auth-status auth-status--error" role="alert">{errorMessage}</p>
					{/if}

					<Button
						type="submit"
						disabled={!canSubmit}
						label={isSubmitting ? 'Continuing…' : 'Continue'}
					/>
				</form>

				<p class="auth-footer">
					Have an account?
					<Link href="/login" label="Log in" />
				</p>
			</div>
		</div>

		<div class="auth-image-panel" aria-hidden="true">
			<img class="auth-image" src="/images/farm-landscape.png" alt="" />
		</div>
	</div>
</div>
