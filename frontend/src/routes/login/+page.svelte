<script lang="ts">
	import '$lib/styles/auth-form.css';
	import BrandHeader from '$lib/components/BrandHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { goto } from '$app/navigation';
	import {
		EMAIL_VERIFICATION_ERROR,
		getAuthErrorMessage,
		getLoginFieldError,
		isAdminEmail,
		loginWithEmail
	} from '$lib/auth';
	import { getFirebaseAuth } from '$lib/firebase';
	import { signOut } from 'firebase/auth';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let formError = $state('');
	let isSubmitting = $state(false);

	function clearErrors() {
		emailError = '';
		passwordError = '';
		formError = '';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clearErrors();
		isSubmitting = true;

		const trimmedEmail = email.trim();

		try {
			const credential = await loginWithEmail(trimmedEmail, password);

			if (!credential.user.emailVerified) {
				await signOut(getFirebaseAuth());
				emailError = EMAIL_VERIFICATION_ERROR;
				return;
			}

			await goto(isAdminEmail(trimmedEmail) ? '/admin' : '/farmer');
		} catch (error) {
			const fieldError = getLoginFieldError(error);

			if (fieldError?.field === 'password') {
				passwordError = fieldError.message;
			} else {
				formError = getAuthErrorMessage(error);
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<div class="auth-page auth-page--centered">
	<div class="auth-stack">
		<BrandHeader />

		<div class="auth-form-wrapper">
			<h1 class="auth-heading">Welcome Back</h1>

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

				<div>
					<TextInput
						label="Password"
						type="password"
						name="password"
						autocomplete="current-password"
						placeholder="Enter Password"
						required
						bind:value={password}
						error={passwordError}
					/>
					<Link href="/forgot-password" label="Forgot password?" variant="small" />
				</div>

				{#if formError}
					<p class="auth-status auth-status--error" role="alert">{formError}</p>
				{/if}

				<Button type="submit" disabled={isSubmitting} label={isSubmitting ? 'Logging in…' : 'Log In'} />
			</form>

			<p class="auth-footer">
				Don't have an account?
				<Link href="/signup" label="Create account" />
			</p>
		</div>
	</div>
</div>
