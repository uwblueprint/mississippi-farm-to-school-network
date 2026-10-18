<script lang="ts">
	import { onMount } from 'svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import {
		loadProfile,
		profile,
		profileFullName,
		roleLabel,
		saveProfile
	} from '$lib/state/profile.svelte';

	let loading = $state(!profile.current);
	let loadError = $state('');

	let editing = $state(false);
	let saving = $state(false);
	let saveError = $state('');
	let name = $state('');
	let phone = $state('');
	let nameError = $state('');
	let phoneError = $state('');

	const current = $derived(profile.current);

	onMount(async () => {
		if (profile.current) return;
		try {
			await loadProfile();
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Failed to load your profile.';
		} finally {
			loading = false;
		}
	});

	function startEditing() {
		name = profileFullName(current);
		phone = current?.phone ?? '';
		nameError = '';
		phoneError = '';
		saveError = '';
		editing = true;
	}

	function validate(): boolean {
		nameError = name.trim() ? '' : 'Please enter your name.';
		const digits = phone.replace(/\D/g, '');
		phoneError =
			phone.trim() && digits.length !== 10 ? 'Phone number must contain exactly 10 digits.' : '';
		return !nameError && !phoneError;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!validate()) return;

		saving = true;
		saveError = '';
		try {
			await saveProfile({ name, phone });
			editing = false;
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Failed to save your changes.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<form class="settings-page" onsubmit={handleSubmit} novalidate>
	<header class="settings-header">
		<h1 class="settings-title">Settings</h1>
		{#if editing}
			<ActionButton variant="primary" size="sm" type="submit" disabled={saving}>
				{saving ? 'Saving…' : 'Save Changes'}
			</ActionButton>
		{:else if current}
			<ActionButton variant="primary" size="sm" onclick={startEditing}>
				Edit
				{#snippet iconRight()}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
				{/snippet}
			</ActionButton>
		{/if}
	</header>

	{#if loading}
		<p class="settings-message">Loading your profile…</p>
	{:else if loadError || !current}
		<p class="settings-message settings-message--error" role="alert">
			{loadError || 'Failed to load your profile.'}
		</p>
	{:else}
		<section class="settings-section" aria-labelledby="settings-profile-heading">
			<h2 class="settings-section__title" id="settings-profile-heading">Profile</h2>

			{#if saveError}
				<p class="settings-message settings-message--error" role="alert">{saveError}</p>
			{/if}

			<div class="settings-fields">
				{#if editing}
					<TextInput
						label="Name"
						name="name"
						autocomplete="name"
						bind:value={name}
						error={nameError}
					/>
					<TextInput
						label="Phone Number"
						name="phone"
						type="tel"
						autocomplete="tel"
						bind:value={phone}
						error={phoneError}
					/>
				{:else}
					<div class="settings-field">
						<span class="settings-field__label">Name</span>
						<span class="settings-field__value">{profileFullName(current) || '—'}</span>
					</div>
					<div class="settings-field">
						<span class="settings-field__label">Phone Number</span>
						<span class="settings-field__value">{current.phone || '—'}</span>
					</div>
				{/if}

				<div class="settings-field">
					<span class="settings-field__label">Email</span>
					<span class="settings-field__value">{current.email}</span>
				</div>
				<div class="settings-field">
					<span class="settings-field__label">Role</span>
					<span class="settings-field__value">{roleLabel(current.role)}</span>
				</div>
			</div>
		</section>
	{/if}
</form>

<style>
	.settings-page {
		/* same fluid side padding as the Farms page */
		padding: 60px clamp(32px, 8cqi, 110px);
		display: flex;
		flex-direction: column;
		gap: 80px;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.settings-title {
		margin: 0;
		color: #000;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 32px;
		font-style: normal;
		font-weight: 500;
		line-height: normal;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	.settings-section__title {
		margin: 0;
		color: #000;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 24px;
		font-weight: 500;
		line-height: normal;
	}

	.settings-fields {
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	/* view mode mirrors TextInput's label/value rhythm so toggling Edit doesn't jump */
	.settings-field {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.settings-field__label {
		color: #000;
		font-family: 'DM Sans', sans-serif;
		font-size: 1.09rem;
		font-weight: 400;
		line-height: normal;
	}

	.settings-field__value {
		color: #696c78;
		font-family: 'DM Sans', sans-serif;
		font-size: 1.019375rem;
		line-height: normal;
		overflow-wrap: anywhere;
	}

	.settings-message {
		margin: 0;
		color: #696c78;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 18px;
	}

	.settings-message--error {
		color: #c4341f;
	}
</style>
