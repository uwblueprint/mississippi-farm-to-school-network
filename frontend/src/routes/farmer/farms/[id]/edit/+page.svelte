<script lang="ts">
	import { page } from '$app/stores';
	import { enhance, deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import ChoiceGroup from '$lib/components/ChoiceGroup.svelte';
	import UploadZone from '$lib/components/UploadZone.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';

	let { data }: { data: PageData } = $props();

	// The [id] segment is the farm's UUID — the same id used by the backend
	// farmById(id) query and the updateFarm(id, input) / resubmitFarm(id, input) mutations.
	const farmId = $derived($page.params.id);

	// --- Form state ---------------------------------------------------------
	// Clean, backend-mapped fields, seeded from the server loader (farmToFormModel).
	// Same FarmFormModel shape the ?/save action reads back out of the form fields.
	const farm = $state({ ...data.form });

	// Options shared by every multi-select checkbox group.
	const CHOICE_OPTIONS = [
		'Organic Practices',
		'Conventional',
		'Regenerative',
		'Hydroponic',
		'Aquaponic',
		'Biodynamic',
		'None of the above'
	];

	// TODO(backend-mapping): the checkbox groups, BIPOC radios and "seasonal"
	// field below have no clean backend mapping yet — they are local, unpersisted
	// UI state and are intentionally NOT sent by the ?/save action.
	const choiceGroups = $state<Record<string, string[]>>({
		growingPractices: [],
		foodSafety: [],
		experiences: [],
		characteristics: [],
		schoolSales: []
	});

	// Yes/No radio groups. TODO(backend-mapping): unpersisted.
	const radioGroups = $state<Record<string, string>>({
		bipoc1: '',
		bipoc2: '',
		bipoc3: '',
		bipoc4: ''
	});

	// Public gallery photos come from the file service (filesByFarm via the loader).
	const galleryPhotos = $derived(data.images.map((img) => ({ id: img.fileId, url: img.url })));

	const rejectedDate = $derived(
		data.rejection ? new Date(data.rejection.createdAt).toLocaleDateString() : ''
	);

	let saving = $state(false);
	let uploading = $state(false);
	let actionError = $state('');
	let galleryInput = $state<HTMLInputElement | null>(null);

	// Manually POST to a named form action (image ops live outside the save form,
	// so they can't be plain nested <form>s). Mirrors use:enhance's request shape.
	async function postAction(action: string, body: FormData): Promise<ActionResult> {
		const res = await fetch(action, {
			method: 'POST',
			headers: { 'x-sveltekit-action': 'true' },
			body
		});
		return deserialize(await res.text());
	}

	async function uploadFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		uploading = true;
		actionError = '';
		try {
			for (const file of Array.from(files)) {
				const fd = new FormData();
				fd.append('file', file);
				const result = await postAction('?/uploadImage', fd);
				if (result.type === 'failure') {
					actionError = String(result.data?.message ?? 'Upload failed.');
				}
			}
			await invalidateAll();
		} finally {
			uploading = false;
		}
	}

	async function removePhoto(fileId: string) {
		actionError = '';
		const fd = new FormData();
		fd.append('fileId', fileId);
		const result = await postAction('?/removeImage', fd);
		if (result.type === 'failure') {
			actionError = String(result.data?.message ?? 'Remove failed.');
		}
		await invalidateAll();
	}

	function deleteFarm() {
		// TODO(backend): delete deferred out of scope — stub kept as-is.
		console.log('delete farm', farmId);
	}
</script>

<svelte:head>
	<title>Edit farm</title>
</svelte:head>

{#snippet actionBar()}
	<div class="action-bar">
		<ActionButton variant="outline" href="/farmer/farms">
			{#snippet iconLeft()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M19 12H5M12 5L5 12L12 19" stroke="#696C78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
			Back
		</ActionButton>

		<ActionButton variant="primary" type="submit" disabled={saving}>
			{saving ? 'Saving…' : 'Save'}
			{#snippet iconRight()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
		</ActionButton>
	</div>
{/snippet}

<!-- Hidden picker used by the public PhotoGallery "Add Photos" tile. -->
<input
	bind:this={galleryInput}
	class="visually-hidden-file"
	type="file"
	accept="image/png,image/jpeg"
	multiple
	onchange={(e) => uploadFiles((e.currentTarget as HTMLInputElement).files)}
/>

<form
	class="edit-page"
	method="POST"
	action="?/save"
	use:enhance={() => {
		saving = true;
		actionError = '';
		return async ({ result, update }) => {
			saving = false;
			if (result.type === 'failure') {
				actionError = String(result.data?.message ?? 'Save failed.');
			}
			// keep the user's edits in the fields; loader re-runs for status/rejection
			await update({ reset: false });
		};
	}}
>
	<!-- Clean, backend-mapped FarmFormModel fields carried to the ?/save action.
	     TextField has no name attribute, so the hidden inputs mirror farm state. -->
	<input type="hidden" name="readableId" value={farm.readableId} />
	<input type="hidden" name="name" value={farm.name} />
	<input type="hidden" name="address" value={farm.address} />
	<input type="hidden" name="counties" value={farm.counties} />
	<input type="hidden" name="phone" value={farm.phone} />
	<input type="hidden" name="email" value={farm.email} />
	<input type="hidden" name="instagram" value={farm.instagram} />
	<input type="hidden" name="facebook" value={farm.facebook} />
	<input type="hidden" name="website" value={farm.website} />
	<input type="hidden" name="other" value={farm.other} />
	<input type="hidden" name="seasonal" value={farm.seasonal} />
	<input type="hidden" name="dashboardImageName" value={farm.dashboardImageName} />
	<!-- Routes the save action to resubmitFarm when REJECTED, else updateFarm. -->
	<input type="hidden" name="status" value={data.status} />

	{@render actionBar()}

	<h1 class="edit-title">Edit {farm.name}</h1>

	{#if data.rejection}
		<div class="rejection-banner" role="alert">
			<span class="rejection-banner__title">This farm was rejected{rejectedDate ? ` on ${rejectedDate}` : ''}.</span>
			<span class="rejection-banner__reason">{data.rejection.reason}</span>
			<span class="rejection-banner__hint">Update the details below and save to resubmit for review.</span>
		</div>
	{/if}

	{#if actionError}
		<p class="form-error" role="alert">{actionError}</p>
	{/if}

	<section class="section">
		<span class="section__subtitle">Dashboard Image</span>
		<UploadZone
			title="Upload new farm photo"
			hint="JPG or PNG, up to 10 pics"
			onFiles={uploadFiles}
			disabled={uploading}
		/>
		{#if farm.dashboardImageName}
			<a class="file-link" href="#dashboard-photo">{farm.dashboardImageName}</a>
		{/if}
	</section>

	<!-- Photo gallery (educator) -->
	<section class="section">
		<span class="section__subtitle">Photo Gallery</span>
		<p class="section__hint">
			*Optional: Upload photos of your farm, operations, and/or products here for educator view.
		</p>
		<UploadZone
			title="Upload farm photos"
			hint="JPG or PNG, up to 10 pics"
			onFiles={uploadFiles}
			disabled={uploading}
		/>
	</section>

	<!-- Photo gallery (public) -->
	<section class="section">
		<span class="section__subtitle">Photo Gallery</span>
		<p class="section__hint">
			*Optional: Upload photos of your farm, operations, and/or products here for people to see when
			they look at your farm!
		</p>
		<PhotoGallery
			photos={galleryPhotos}
			onAdd={() => galleryInput?.click()}
			onRemove={removePhoto}
		/>
	</section>

	<section class="section">
		<h2 class="section__heading">Farm Basics</h2>

		<TextField label="Farm ID#" value={farm.readableId} readonly />

		<TextField label="Farm Name" bind:value={farm.name} />
		<TextField label="Farm address" bind:value={farm.address} />
		<TextField label="Counties and/or Cities Served" bind:value={farm.counties} />
	</section>

	<section class="section">
		<h2 class="section__heading">Primary Contact Information</h2>

		<div class="field-grid">
			<TextField label="Phone Number" bind:value={farm.phone} />
			<TextField label="Email Address" bind:value={farm.email} />
			<TextField label="*Optional: Instagram" bind:value={farm.instagram} optional />
			<TextField label="*Optional: Facebook" bind:value={farm.facebook} optional />
			<TextField label="*Optional: Website" bind:value={farm.website} optional />
			<TextField label="*Optional: Other (social media + username)" bind:value={farm.other} optional />
		</div>
	</section>

	<section class="section">
		<h2 class="section__heading">Farm Profile</h2>

		<ChoiceGroup label="Growing Practices" options={CHOICE_OPTIONS} type="checkbox" bind:value={choiceGroups.growingPractices} />

		<TextField label="Seasonal product and products offered" bind:value={farm.seasonal} multiline />

		<ChoiceGroup label="Food Safety & Certifications" options={CHOICE_OPTIONS} type="checkbox" bind:value={choiceGroups.foodSafety} />
		<ChoiceGroup label="Farm Experiences & Services" options={CHOICE_OPTIONS} type="checkbox" bind:value={choiceGroups.experiences} />
		<ChoiceGroup label="Farm Characteristics" options={CHOICE_OPTIONS} type="checkbox" bind:value={choiceGroups.characteristics} />
		<ChoiceGroup label="Farm to School Sales" options={CHOICE_OPTIONS} type="checkbox" bind:value={choiceGroups.schoolSales} />

		<ChoiceGroup label="Does your farm identify as BIPOC-owned?" options={['Yes', 'No']} type="radio" name="bipoc1" bind:value={radioGroups.bipoc1} />
		<ChoiceGroup label="Does your farm identify as BIPOC-owned?" options={['Yes', 'No']} type="radio" name="bipoc2" bind:value={radioGroups.bipoc2} />
		<ChoiceGroup label="Does your farm identify as BIPOC-owned?" options={['Yes', 'No']} type="radio" name="bipoc3" bind:value={radioGroups.bipoc3} />
		<ChoiceGroup label="Does your farm identify as BIPOC-owned?" options={['Yes', 'No']} type="radio" name="bipoc4" bind:value={radioGroups.bipoc4} />
	</section>

	<div class="footer-actions">
		<ActionButton variant="primary" type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Save'}</ActionButton>
		<ActionButton variant="danger" onclick={deleteFarm}>Delete Farm</ActionButton>
	</div>

	{@render actionBar()}
</form>

<style>
	.edit-page {
		padding: 72px clamp(32px, 8cqi, 110px);
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		box-sizing: border-box;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		color: #131927;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	/* Back/Save ↔ main content: 70px total (28px flex gap + 42px) */
	.edit-page > .action-bar:first-child {
		margin-bottom: 42px;
	}

	.edit-page > .action-bar:last-child {
		margin-top: 42px;
	}

	.edit-title {
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 32px;
		font-weight: 500;
		line-height: normal;
		color: #000;
	}

	/* Hidden file input driving the public gallery "Add Photos" tile. */
	.visually-hidden-file {
		display: none;
	}

	.rejection-banner {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 18px 22px;
		border: 1px solid #f2c4bf;
		border-left: 6px solid #d9544c;
		border-radius: 10px;
		background: #fce4e1;
		color: #7a2318;
	}

	.rejection-banner__title {
		font-size: 19px;
		font-weight: 600;
	}

	.rejection-banner__reason {
		font-size: 17px;
		font-weight: 400;
	}

	.rejection-banner__hint {
		font-size: 15px;
		font-weight: 300;
	}

	.form-error {
		margin: 0;
		color: #c4341f;
		font-size: 17px;
		font-weight: 400;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 38px;
	}

	.section__heading {
		color: #000;
		font-size: 24px;
		font-weight: 400;
		line-height: 34px;
		margin: 12px 0 4px;
	}

	.section__hint {
		color: #000;
		font-size: 21px;
		font-weight: 300;
		margin: 0;
	}

	/* Section subtitle (e.g. "Photo Gallery", "Dashboard Image") — H2 headline */
	.section__subtitle {
		color: #000;
		font-size: 24px;
		font-weight: 400;
		line-height: 34px;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 38px;
	}

	.file-link {
		color: #3742b4;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 21px;
		font-weight: 300;
		line-height: normal;
		text-decoration-line: underline;
		text-decoration-style: solid;
		text-decoration-skip-ink: auto;
		text-underline-position: from-font;
		width: fit-content;
	}

	.footer-actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 48px;
		/* end of questions ↔ Save: 48px total (28px flex gap + 20px) */
		margin-top: 20px;
	}
</style>
