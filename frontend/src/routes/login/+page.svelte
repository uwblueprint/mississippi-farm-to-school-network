<script lang="ts">
	import '$lib/styles/auth/auth-form.css';
	import AuthPageLayout from '$lib/components/auth/AuthPageLayout.svelte';
	import AuthStatusMessage from '$lib/components/auth/AuthStatusMessage.svelte';
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { goto } from '$app/navigation';
	import {
		getAuthErrorMessage,
		getLoginFieldError,
		getPostAuthDestination,
		loginWithEmail
	} from '$lib/auth';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	function clearErrors() {
		emailError = '';
		passwordError = '';
		errorMessage = '';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clearErrors();
		isSubmitting = true;

		const trimmedEmail = email.trim();

		try {
			const credential = await loginWithEmail(trimmedEmail, password);

			if (!credential.user.emailVerified) {
				await goto('/verify-email');
				return;
			}

			await goto(getPostAuthDestination(trimmedEmail, 'login'));
		} catch (error) {
			const fieldError = getLoginFieldError(error);

			if (fieldError?.field === 'password') {
				passwordError = fieldError.message;
			} else {
				errorMessage = getAuthErrorMessage(error);
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<AuthPageLayout>
	<div class="auth-form-section auth-form-section--start">
		<h1 class="auth-title">Welcome Back</h1>

		<form class="auth-form" onsubmit={handleSubmit}>
			<TextInput
				label="Email Address"
				type="email"
				name="email"
				autocomplete="email"
				placeholder="farmer@gmail.com"
				required
				bind:value={email}
				error={emailError}
			/>

			<div class="auth-password-group">
				<TextInput
					label="Password"
					type="password"
					name="password"
					autocomplete="current-password"
					placeholder="Enter Password"
					required
					showPasswordToggle
					bind:value={password}
					error={passwordError}
				/>
				<Link href="/forgot-password" label="Forgot password?" variant="small" />
			</div>

			{#if errorMessage}
				<AuthStatusMessage message={errorMessage} />
			{/if}

			<div class="auth-form-actions">
				<Button
					type="submit"
					disabled={isSubmitting}
					label={isSubmitting ? 'Logging in…' : 'Log In'}
				/>

				<p class="auth-footer auth-footer--login">
					<span>Don't have an account?&nbsp;</span>
					<Link href="/signup" label="Create account" />
				</p>
			</div>
		</form>
	</div>
</AuthPageLayout>
