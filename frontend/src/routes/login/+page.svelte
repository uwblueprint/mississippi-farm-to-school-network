<script lang="ts">
	import '$lib/styles/auth/auth-form.css';
	import AuthPageLayout from '$lib/components/auth/AuthPageLayout.svelte';
	import AuthStatusMessage from '$lib/components/auth/AuthStatusMessage.svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import Link from '$lib/components/Link.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { User } from 'firebase/auth';
	import {
		getAuthErrorMessage,
		getLoginFieldError,
		getPostAuthDestination,
		loginWithEmail,
		resolveUserRole,
		syncAuthTokenCookie
	} from '$lib/auth';
	import { getFirebaseAuth } from '$lib/firebase';

	/** Same-origin paths only, so `?redirectTo=` can't send users to another site. */
	function getFarmerRedirect(): string | null {
		const redirectTo = page.url.searchParams.get('redirectTo');
		if (
			!redirectTo?.startsWith('/') ||
			redirectTo.startsWith('//') ||
			redirectTo.startsWith('/\\')
		) {
			return null;
		}
		return redirectTo;
	}

	/** `?redirectTo=` applies to farmers only; admins always land on their dashboard. */
	async function getDestination(user: User): Promise<string> {
		const farmerRedirect = getFarmerRedirect();
		if (farmerRedirect && (await resolveUserRole(user)) === 'FARMER') {
			return farmerRedirect;
		}
		return getPostAuthDestination(user);
	}

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	onMount(async () => {
		const auth = getFirebaseAuth();
		await auth.authStateReady();
		const user = auth.currentUser;

		if (user?.emailVerified) {
			await syncAuthTokenCookie(user);
			await goto(await getDestination(user), { replaceState: true });
		}
	});

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

			await syncAuthTokenCookie(credential.user);
			await goto(await getDestination(credential.user));
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
				<ActionButton
					variant="primary"
					block
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
