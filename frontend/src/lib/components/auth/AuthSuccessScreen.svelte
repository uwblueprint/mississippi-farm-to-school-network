<script lang="ts">
	import '$lib/styles/auth/auth-form.css';
	import { goto } from '$app/navigation';
	import AuthPageLayout from '$lib/components/auth/AuthPageLayout.svelte';
	import Button from '$lib/components/Button.svelte';

	interface Props {
		heading: string;
		message: string;
		buttonLabel: string;
		buttonHref: string;
	}

	let { heading, message, buttonLabel, buttonHref }: Props = $props();
</script>

<AuthPageLayout>
	<div class="auth-success-status" aria-live="polite">
		<img class="auth-success-icon" src="/images/auth/success.svg" alt="" aria-hidden="true" />

		<div class="auth-success-message-group">
			<h1 class="auth-title auth-title--centered">{heading}</h1>
			<p class="auth-body-text">{message}</p>
		</div>
	</div>

	{#snippet actions()}
		<Button label={buttonLabel} onclick={() => goto(buttonHref)} />
	{/snippet}
</AuthPageLayout>
