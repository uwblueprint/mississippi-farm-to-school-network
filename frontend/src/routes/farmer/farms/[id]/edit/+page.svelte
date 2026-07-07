<script lang="ts">
	import { page } from '$app/stores';
	import ActionButton from '$lib/components/ActionButton.svelte';

	// The [id] segment is the farm's UUID — the same id used by the backend
	// farmById(id) query and the updateFarm(id, input) / resubmitFarm(id, input) mutations.
	const farmId = $derived($page.params.id);

	// --- Form state ---------------------------------------------------------
	// Seeded with sample values for now; a +page.server.ts loader will hydrate
	// these from the farm record once an owner-scoped query exists on the backend.
	const farm = $state({
		readableId: '32486126374',
		name: 'Two Brooks Farm',
		address: '235 North State St Clarksdale, MS 38614',
		counties: 'Coahoma County',
		phone: '647-234-5678',
		email: '',
		instagram: '',
		facebook: '',
		website: '',
		other: '',
		seasonal: '',
		dashboardImageName: 'farmphoto.png'
	});

	// Multi-select checkbox groups. Keyed so the same markup snippet drives each.
	const CHOICE_OPTIONS = [
		'Organic Practices',
		'Conventional',
		'Regenerative',
		'Hydroponic',
		'Aquaponic',
		'Biodynamic',
		'None of the above'
	];

	const choiceGroups = $state<Record<string, string[]>>({
		growingPractices: [],
		foodSafety: [],
		experiences: [],
		characteristics: [],
		schoolSales: []
	});

	function toggleChoice(group: string, option: string) {
		const current = choiceGroups[group];
		choiceGroups[group] = current.includes(option)
			? current.filter((o) => o !== option)
			: [...current, option];
	}

	// Yes/No radio groups.
	const radioGroups = $state<Record<string, 'yes' | 'no' | ''>>({
		bipoc1: '',
		bipoc2: '',
		bipoc3: '',
		bipoc4: ''
	});

	// --- Actions (placeholders until mutations are wired) -------------------
	function save() {
		// maps to updateFarm(id, input) — REJECTED farms would route to resubmitFarm.
		console.log('save farm', farmId, $state.snapshot(farm), $state.snapshot(choiceGroups));
	}

	function deleteFarm() {
		console.log('delete farm', farmId);
	}
</script>

<svelte:head>
	<title>Edit farm</title>
</svelte:head>

<!-- ===================== reusable field snippets ===================== -->

{#snippet textField(label: string, key: keyof typeof farm, placeholder = '', optional = false)}
	<label class="field">
		<span class="field__label" class:field__label--optional={optional}>{label}</span>
		<input class="field__input" {placeholder} bind:value={farm[key]} />
	</label>
{/snippet}

{#snippet checkboxGroup(label: string, group: string, options: string[])}
	<fieldset class="choice-group">
		<legend class="choice-group__label">{label}</legend>
		{#each options as option (option)}
			<label class="choice">
				<input
					type="checkbox"
					checked={choiceGroups[group].includes(option)}
					onchange={() => toggleChoice(group, option)}
				/>
				<span>{option}</span>
			</label>
		{/each}
	</fieldset>
{/snippet}

{#snippet yesNo(label: string, group: string)}
	<fieldset class="choice-group">
		<legend class="choice-group__label">{label}</legend>
		<label class="choice">
			<input type="radio" name={group} value="yes" bind:group={radioGroups[group]} />
			<span>Yes</span>
		</label>
		<label class="choice">
			<input type="radio" name={group} value="no" bind:group={radioGroups[group]} />
			<span>No</span>
		</label>
	</fieldset>
{/snippet}

{#snippet uploadZone(title: string, hint: string)}
	<div class="upload-zone">
		<span class="upload-zone__icon">
			<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none" aria-hidden="true">
				<path d="M30.625 21.875V23.625C30.625 26.0752 30.625 27.3003 30.1482 28.2362C29.7287 29.0594 29.0594 29.7287 28.2362 30.1482C27.3003 30.625 26.0752 30.625 23.625 30.625H11.375C8.92477 30.625 7.69966 30.625 6.76379 30.1482C5.94058 29.7287 5.27129 29.0594 4.85185 28.2362C4.375 27.3003 4.375 26.0752 4.375 23.625V21.875M10.2083 11.6667L17.5 4.375L24.7917 11.6667M17.5 4.375V21.875" stroke="black" stroke-width="2.91667" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span class="upload-zone__title">{title}</span>
		<span class="upload-zone__hint">{hint}</span>
	</div>
{/snippet}

<!-- ===================== page ===================== -->

<form
	class="edit-page"
	onsubmit={(e) => {
		e.preventDefault();
		save();
	}}
>
	<!-- top action bar -->
	<div class="action-bar">
		<ActionButton variant="outline" href="/farmer/farms">
			{#snippet iconLeft()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="aspect-ratio: 1 / 1;">
					<path d="M19 12H5M12 5L5 12L12 19" stroke="#696C78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
			Back
		</ActionButton>

		<ActionButton variant="primary" type="submit">
			Save
			{#snippet iconRight()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="aspect-ratio: 1 / 1;">
					<path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
		</ActionButton>
	</div>

	<h1 class="edit-title">Edit {farm.name}</h1>

	<!-- ---------- Dashboard image ---------- -->
	<section class="section">
		<span class="field__label">Dashboard Image</span>
		{@render uploadZone('Upload new farm photo', 'JPG or PNG, up to 10 pics')}
		<a class="file-link" href="#dashboard-photo">{farm.dashboardImageName}</a>
	</section>

	<!-- ---------- Photo gallery (educator) ---------- -->
	<section class="section">
		<span class="field__label">Photo Gallery</span>
		<p class="section__hint">
			*Optional: Upload photos of your farm, operations, and/or products here for educator view.
		</p>
		{@render uploadZone('Upload farm photos', 'JPG or PNG, up to 10 pics')}
	</section>

	<!-- ---------- Photo gallery (public) ---------- -->
	<section class="section">
		<span class="field__label">Photo Gallery</span>
		<p class="section__hint">
			*Optional: Upload photos of your farm, operations, and/or products here for people to see when
			they look at your farm!
		</p>
		<div class="gallery-grid">
			{#each Array(9) as _, i (i)}
				<div class="gallery-item">
					<div class="gallery-item__media">
						<!-- real image goes here: <img src=… /> or a background-image on this element -->
					</div>
					<button type="button" class="gallery-item__remove" aria-label="Remove photo">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<rect x="0.5" y="0.5" width="23" height="23" rx="11.5" fill="white" />
							<rect x="0.5" y="0.5" width="23" height="23" rx="11.5" stroke="#D6D6D6" />
							<path d="M17 7L7 17M7 7L17 17" stroke="#131927" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>
				</div>
			{/each}
			<button type="button" class="gallery-add">
				<span class="gallery-add__plus">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M12 5V19M5 12H19" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</span>
				<span class="gallery-add__label">Add Photos</span>
			</button>
		</div>
	</section>

	<!-- ---------- Farm basics ---------- -->
	<section class="section">
		<h2 class="section__heading">Farm Basics</h2>

		<div class="field">
			<span class="field__label field__label--strong">Farm ID#</span>
			<span class="field__readonly">{farm.readableId}</span>
		</div>

		{@render textField('Farm Name', 'name')}
		{@render textField('Farm address', 'address')}
		{@render textField('Counties and/or Cities Served', 'counties')}
	</section>

	<!-- ---------- Primary contact ---------- -->
	<section class="section">
		<h2 class="section__heading">Primary Contact Information</h2>

		<div class="field-grid">
			{@render textField('Phone Number', 'phone')}
			{@render textField('Email Address', 'email')}
			{@render textField('*Optional: Instagram', 'instagram', '', true)}
			{@render textField('*Optional: Facebook', 'facebook', '', true)}
			{@render textField('*Optional: Website', 'website', '', true)}
			{@render textField('*Optional: Other (social media + username)', 'other', '', true)}
		</div>
	</section>

	<!-- ---------- Farm profile ---------- -->
	<section class="section">
		<h2 class="section__heading">Farm Profile</h2>

		{@render checkboxGroup('Growing Practices', 'growingPractices', CHOICE_OPTIONS)}

		<label class="field">
			<span class="field__label">Seasonal product and products offered</span>
			<textarea class="field__input field__textarea" rows="4" bind:value={farm.seasonal}></textarea>
		</label>

		{@render checkboxGroup('Food Safety & Certifications', 'foodSafety', CHOICE_OPTIONS)}
		{@render checkboxGroup('Farm Experiences & Services', 'experiences', CHOICE_OPTIONS)}
		{@render checkboxGroup('Farm Characteristics', 'characteristics', CHOICE_OPTIONS)}
		{@render checkboxGroup('Farm to School Sales', 'schoolSales', CHOICE_OPTIONS)}

		{@render yesNo('Does your farm identify as BIPOC-owned?', 'bipoc1')}
		{@render yesNo('Does your farm identify as BIPOC-owned?', 'bipoc2')}
		{@render yesNo('Does your farm identify as BIPOC-owned?', 'bipoc3')}
		{@render yesNo('Does your farm identify as BIPOC-owned?', 'bipoc4')}
	</section>

	<!-- ---------- Footer actions ---------- -->
	<div class="footer-actions">
		<ActionButton variant="primary" type="submit" block>Save</ActionButton>
		<ActionButton variant="danger" onclick={deleteFarm}>Delete Farm</ActionButton>
	</div>

	<div class="action-bar">
		<ActionButton variant="outline" href="/farmer/farms">
			{#snippet iconLeft()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="aspect-ratio: 1 / 1;">
					<path d="M19 12H5M12 5L5 12L12 19" stroke="#696C78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
			Back
		</ActionButton>

		<ActionButton variant="primary" type="submit">
			Save
			{#snippet iconRight()}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="aspect-ratio: 1 / 1;">
					<path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
		</ActionButton>
	</div>
</form>

<style>
	/* Placeholder structural styling — class hooks are stable so Figma CSS drops
	   straight onto each piece later. */
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

	.section {
		display: flex;
		flex-direction: column;
		/* vertical gap between questions */
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

	/* ----- fields ----- */
	.field {
		display: flex;
		flex-direction: column;
		/* label ↔ input */
		gap: 14px;
	}

	.field__label {
		font-size: 21px;
		font-weight: 300;
		color: #131927;
	}

	/* Optional field labels */
	.field__label--optional {
		color: #000;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 21px;
		font-weight: 300;
		line-height: normal;
	}

	/* Farm ID# — heavier than the light field labels */
	.field__label--strong {
		font-weight: 400;
	}

	/* Section subtitle (e.g. "Photo Gallery", "Dashboard Image") — H2 headline */
	.section > .field__label {
		color: #000;
		font-size: 24px;
		font-weight: 400;
		line-height: 34px;
	}

	.field__input {
		padding: 16.8px 22.4px;
		border-radius: 11.2px;
		border: 1.82px solid #d3d5de; /* --Neutral-300 */
		background: #fff; /* --Neutral-0 */
		font-size: 17.343px;
		font-family: 'Nunito Variable', 'Nunito', 'DM Sans Variable', sans-serif;
		font-weight: 400;
		line-height: normal;
		color: #383b4a; /* --Neutral-600 */
		box-sizing: border-box;
	}

	.field__textarea {
		resize: vertical;
	}

	.field__readonly {
		color: #383b4a; /* --Neutral-600 */
		font-family: 'Nunito Variable', 'Nunito', sans-serif;
		font-size: 17.343px;
		font-weight: 400;
		line-height: normal;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		/* vertical + horizontal gap between questions */
		gap: 38px;
	}

	/* ----- choice (checkbox / radio) groups ----- */
	.choice-group {
		border: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		/* label-to-label gap */
		gap: 12px;
	}

	.choice-group__label {
		font-size: 21px;
		padding: 0;
		/* title ↔ labels: 2px more than the 12px label-to-label gap */
		margin-bottom: 14px;
	}

	.choice {
		display: flex;
		align-items: center;
		gap: 16px;
		font-size: 21px;
		width: fit-content;
	}

	.choice span {
		color: #000;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 21px;
		font-style: normal;
		font-weight: 300;
		line-height: normal;
	}

	.choice input {
		width: 24px;
		height: 24px;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		flex-shrink: 0;
		appearance: none;
		-webkit-appearance: none;
		border: none;
		background-color: transparent;
		background-repeat: no-repeat;
		background-position: center;
		background-size: 24px 24px;
		cursor: pointer;
	}

	.choice input[type='checkbox'] {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect x='0.75' y='0.75' width='22.5' height='22.5' rx='1.25' stroke='%239EA0AD' stroke-width='1.5'/%3E%3C/svg%3E");
	}

	.choice input[type='checkbox']:checked {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect x='0.75' y='0.75' width='22.5' height='22.5' rx='1.25' fill='%23131927' stroke='%23131927' stroke-width='1.5'/%3E%3Cpath d='M6.5 12.5L10.5 16.5L17.5 8.5' stroke='white' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	}

	.choice input[type='radio'] {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='11.25' stroke='%239EA0AD' stroke-width='1.5'/%3E%3C/svg%3E");
	}

	.choice input[type='radio']:checked {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='11.25' stroke='%23131927' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='6' fill='%23131927'/%3E%3C/svg%3E");
	}

	/* ----- uploads ----- */
	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 49px 24px 29px;
		border: 1px dashed #c5c8d8;
		border-radius: 12px;
		text-align: center;
	}

	.upload-zone__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 65px;
		height: 65px;
		flex-shrink: 0;
		border-radius: 32.5px;
		border: 1px solid #d6d6d6;
		background: #fff;
	}

	.upload-zone__icon svg {
		width: 35px;
		height: 35px;
		flex-shrink: 0;
		aspect-ratio: 1 / 1;
	}

	.upload-zone__title {
		color: #000;
		text-align: center;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 22.711px;
		font-weight: 500;
		line-height: 38.933px;
	}

	.upload-zone__hint {
		color: #000;
		text-align: center;
		font-size: 14px;
		font-weight: 400;
		line-height: 16px;
		align-self: stretch;
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

	/* ----- gallery ----- */
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
		gap: 12px;
	}

	.gallery-item {
		/* positioning context for the corner button — must NOT clip */
		position: relative;
		aspect-ratio: 1 / 1;
	}

	/* holds/clips the photo to rounded corners; the remove button lives outside this */
	.gallery-item__media {
		width: 100%;
		height: 100%;
		border-radius: 12px;
		overflow: hidden;
		background: #d9d9d9;
	}

	.gallery-item__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.gallery-item__remove {
		position: absolute;
		/* centered on the image's top-right corner */
		top: -12px;
		right: -12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		/* revealed on hover */
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.gallery-item__remove svg {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		aspect-ratio: 1 / 1;
	}

	.gallery-item:hover .gallery-item__remove,
	.gallery-item__remove:focus-visible {
		opacity: 1;
	}

	.gallery-add {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		aspect-ratio: 1 / 1;
		border: 2px dashed #d9d9d9;
		border-radius: 12px;
		background: #fff;
		cursor: pointer;
	}

	.gallery-add__plus {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.gallery-add__plus svg {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.gallery-add__label {
		color: #000;
		text-align: center;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		font-weight: 400;
		line-height: 16px;
	}

	/* ----- footer ----- */
	.footer-actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		/* Save ↔ Delete spacing */
		gap: 48px;
		/* end of questions ↔ Save: 48px total (28px flex gap + 20px) */
		margin-top: 20px;
	}
</style>
