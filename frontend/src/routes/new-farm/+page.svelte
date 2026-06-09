<script lang="ts">
	import { untrack } from 'svelte';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	let usdaFarmId = $state('');
	let farmName = $state('');
	let farmAddress = $state('');
	let countiesCities = $state('');
	let phone = $state(untrack(() => data.user?.phone ?? ''));
	let email = $state(untrack(() => data.user?.email ?? ''));
	let socialMedia = $state('');

	let growingPractices = $state<string[]>([]);
	let seasonalProducts = $state('');
	let bipocOwned = $state<boolean | null>(null);
	let gapCertified = $state<boolean | null>(null);
	let foodSafetyPlan = $state<boolean | null>(null);
	let agritourism = $state<boolean | null>(null);
	let marketParticipation = $state<boolean | null>(null);
	let csaAvailable = $state<boolean | null>(null);
	let onlineSales = $state<boolean | null>(null);
	let deliveryDetails = $state('');

	let f2sExperience = $state('');
	let interestedInF2s = $state<boolean | null>(null);
	let minimumOrder = $state('');

	let selectedFiles = $state<File[]>([]);

	const GROWING_PRACTICES = ['Organic', 'Conventional', 'Hydroponic', 'Regenerative', 'Mixed'];
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let touched = $state<Record<string, boolean>>({});

	const errors = $derived({
		usdaFarmId: usdaFarmId.trim() === '' ? 'Farm ID is required.' : '',
		farmName: farmName.trim() === '' ? 'Farm name is required.' : '',
		farmAddress: farmAddress.trim() === '' ? 'Farm address is required.' : '',
		countiesCities:
			countiesCities.trim() === '' ? 'Counties and/or cities served is required.' : '',
		phone:
			phone === ''
				? 'Phone number is required.'
				: phone.length !== 10
					? 'Enter a 10-digit phone number.'
					: '',
		email:
			email.trim() === ''
				? 'Email address is required.'
				: !emailPattern.test(email)
					? 'Enter a valid email address.'
					: '',
		socialMedia: socialMedia.trim() === '' ? 'Social media is required.' : '',
		growingPractices: growingPractices.length === 0 ? 'Select at least one growing practice.' : '',
		seasonalProducts: seasonalProducts.trim() === '' ? 'This field is required.' : '',
		bipocOwned: bipocOwned === null ? 'Please select an option.' : '',
		gapCertified: gapCertified === null ? 'Please select an option.' : '',
		foodSafetyPlan: foodSafetyPlan === null ? 'Please select an option.' : '',
		agritourism: agritourism === null ? 'Please select an option.' : '',
		marketParticipation: marketParticipation === null ? 'Please select an option.' : '',
		csaAvailable: csaAvailable === null ? 'Please select an option.' : '',
		onlineSales: onlineSales === null ? 'Please select an option.' : '',
		deliveryDetails: deliveryDetails.trim() === '' ? 'This field is required.' : '',
		f2sExperience: f2sExperience.trim() === '' ? 'This field is required.' : '',
		interestedInF2s: interestedInF2s === null ? 'Please select an option.' : '',
		minimumOrder: minimumOrder.trim() === '' ? 'Minimum order is required.' : ''
	});

	const isValid = $derived(Object.values(errors).every((message) => message === ''));

	function digitsOnly(value: string) {
		return value.replace(/\D/g, '');
	}

	function handleFarmIdInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const cleaned = digitsOnly(input.value).slice(0, 10);
		usdaFarmId = cleaned;
		input.value = cleaned;
	}

	function handlePhoneInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const cleaned = digitsOnly(input.value).slice(0, 10);
		phone = cleaned;
		input.value = cleaned;
	}

	function toggleGrowingPractice(practice: string, checked: boolean) {
		growingPractices = checked
			? [...growingPractices, practice]
			: growingPractices.filter((p) => p !== practice);
		touched.growingPractices = true;
	}

	function handleFileChange(details: { acceptedFiles: File[] }) {
		selectedFiles = details.acceptedFiles;
	}

	function handleSubmit() {
		for (const key of Object.keys(errors)) {
			touched[key] = true;
		}
		if (!isValid) return;
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

{#snippet yesNo(field: string, value: boolean | null, set: (v: boolean) => void)}
	<div
		class="choice-list"
		class:group-error={touched[field] && errors[field as keyof typeof errors]}
	>
		<label class="choice">
			<input
				type="radio"
				name={field}
				checked={value === true}
				onchange={() => {
					set(true);
					touched[field] = true;
				}}
			/>
			<span>Yes</span>
		</label>
		<label class="choice">
			<input
				type="radio"
				name={field}
				checked={value === false}
				onchange={() => {
					set(false);
					touched[field] = true;
				}}
			/>
			<span>No</span>
		</label>
	</div>
	{#if touched[field] && errors[field as keyof typeof errors]}
		<span class="error-text">{errors[field as keyof typeof errors]}</span>
	{/if}
{/snippet}

<div class="container">
	<div class="header">
		<h1>Create a Farm</h1>
		<button class="back-btn" type="button">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
			Back
		</button>
	</div>

	<h2 class="section-title">Farm Basics</h2>

	<div class="form-group">
		<label class="field-label" for="usda-farm-id">Farm ID#</label>
		<input
			id="usda-farm-id"
			class="field"
			class:input-error={touched.usdaFarmId && errors.usdaFarmId}
			inputmode="numeric"
			placeholder="e.g. 32486126374"
			value={usdaFarmId}
			oninput={handleFarmIdInput}
			onblur={() => (touched.usdaFarmId = true)}
		/>
		{#if touched.usdaFarmId && errors.usdaFarmId}
			<span class="error-text">{errors.usdaFarmId}</span>
		{/if}
	</div>

	<div class="form-group">
		<label class="field-label" for="farm-name">Farm Name</label>
		<input
			id="farm-name"
			class="field"
			class:input-error={touched.farmName && errors.farmName}
			placeholder="e.g. Two Brooks Farm"
			bind:value={farmName}
			onblur={() => (touched.farmName = true)}
		/>
		{#if touched.farmName && errors.farmName}
			<span class="error-text">{errors.farmName}</span>
		{/if}
	</div>

	<div class="form-group">
		<label class="field-label" for="farm-address">Farm address</label>
		<div class="search-field">
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="11" cy="11" r="7" />
				<path d="M21 21l-4.35-4.35" />
			</svg>
			<input
				id="farm-address"
				class="field"
				class:input-error={touched.farmAddress && errors.farmAddress}
				placeholder="Search Farm Address"
				bind:value={farmAddress}
				onblur={() => (touched.farmAddress = true)}
			/>
		</div>
		{#if touched.farmAddress && errors.farmAddress}
			<span class="error-text">{errors.farmAddress}</span>
		{/if}
	</div>

	<div class="form-group">
		<label class="field-label" for="counties-cities">Counties and/or Cities Served</label>
		<input
			id="counties-cities"
			class="field"
			class:input-error={touched.countiesCities && errors.countiesCities}
			placeholder="e.g. Bolivar County, Coahoma County"
			bind:value={countiesCities}
			onblur={() => (touched.countiesCities = true)}
		/>
		{#if touched.countiesCities && errors.countiesCities}
			<span class="error-text">{errors.countiesCities}</span>
		{/if}
	</div>

	<h2 class="section-title">Primary Contact Information</h2>

	<div class="row">
		<div class="form-group">
			<label class="field-label" for="phone">Phone Number</label>
			<input
				id="phone"
				class="field"
				class:input-error={touched.phone && errors.phone}
				inputmode="numeric"
				placeholder="10 digit number"
				value={phone}
				oninput={handlePhoneInput}
				onblur={() => (touched.phone = true)}
			/>
			{#if touched.phone && errors.phone}
				<span class="error-text">{errors.phone}</span>
			{/if}
		</div>

		<div class="form-group">
			<label class="field-label" for="email">Email Address</label>
			<input
				id="email"
				class="field"
				class:input-error={touched.email && errors.email}
				type="email"
				placeholder="e.g. name@email.com"
				bind:value={email}
				onblur={() => (touched.email = true)}
			/>
			{#if touched.email && errors.email}
				<span class="error-text">{errors.email}</span>
			{/if}
		</div>
	</div>

	<div class="form-group">
		<label class="field-label" for="social-media">Social Media</label>
		<input
			id="social-media"
			class="field"
			class:input-error={touched.socialMedia && errors.socialMedia}
			placeholder="e.g. Instagram, X"
			bind:value={socialMedia}
			onblur={() => (touched.socialMedia = true)}
		/>
		{#if touched.socialMedia && errors.socialMedia}
			<span class="error-text">{errors.socialMedia}</span>
		{/if}
	</div>

	<h2 class="section-title">Farm Profile</h2>

	<div class="form-group">
		<span class="field-label">Growing Practices</span>
		<div
			class="choice-list"
			class:group-error={touched.growingPractices && errors.growingPractices}
		>
			{#each GROWING_PRACTICES as practice}
				<label class="choice">
					<input
						type="checkbox"
						checked={growingPractices.includes(practice)}
						onchange={(e) => toggleGrowingPractice(practice, e.currentTarget.checked)}
					/>
					<span>{practice}</span>
				</label>
			{/each}
		</div>
		{#if touched.growingPractices && errors.growingPractices}
			<span class="error-text">{errors.growingPractices}</span>
		{/if}
	</div>

	<div class="form-group">
		<label class="field-label" for="seasonal-products">Seasonal product and products offered</label>
		<textarea
			id="seasonal-products"
			class="field"
			class:input-error={touched.seasonalProducts && errors.seasonalProducts}
			rows="3"
			placeholder="Describe your produce offerings by season..."
			bind:value={seasonalProducts}
			onblur={() => (touched.seasonalProducts = true)}
		></textarea>
		{#if touched.seasonalProducts && errors.seasonalProducts}
			<span class="error-text">{errors.seasonalProducts}</span>
		{/if}
	</div>

	<div class="form-group">
		<span class="field-label">Does your farm identify as BIPOC-owned?</span>
		{@render yesNo('bipocOwned', bipocOwned, (v) => (bipocOwned = v))}
	</div>

	<div class="form-group">
		<span class="field-label">Are you GAP/GHP Certified?</span>
		{@render yesNo('gapCertified', gapCertified, (v) => (gapCertified = v))}
	</div>

	<div class="form-group">
		<span class="field-label">Written food safety plan (if not GAP/GHP certified)</span>
		{@render yesNo('foodSafetyPlan', foodSafetyPlan, (v) => (foodSafetyPlan = v))}
	</div>

	<div class="form-group">
		<span class="field-label">Agritourism / field trips</span>
		{@render yesNo('agritourism', agritourism, (v) => (agritourism = v))}
	</div>

	<div class="form-group">
		<span class="field-label">Farmers market participation</span>
		{@render yesNo('marketParticipation', marketParticipation, (v) => (marketParticipation = v))}
	</div>

	<div class="form-group">
		<span class="field-label">CSA box available</span>
		{@render yesNo('csaAvailable', csaAvailable, (v) => (csaAvailable = v))}
	</div>

	<div class="form-group">
		<span class="field-label">Online sales</span>
		{@render yesNo('onlineSales', onlineSales, (v) => (onlineSales = v))}
	</div>

	<div class="form-group">
		<label class="field-label" for="delivery-details">Delivery details (area, fees, minimums)</label
		>
		<textarea
			id="delivery-details"
			class="field"
			class:input-error={touched.deliveryDetails && errors.deliveryDetails}
			rows="3"
			placeholder="Service area, delivery fees, and minimum order amounts..."
			bind:value={deliveryDetails}
			onblur={() => (touched.deliveryDetails = true)}
		></textarea>
		{#if touched.deliveryDetails && errors.deliveryDetails}
			<span class="error-text">{errors.deliveryDetails}</span>
		{/if}
	</div>

	<h2 class="section-title">School &amp; ECE Interest</h2>

	<div class="form-group">
		<label class="field-label" for="f2s-experience">Farm to School or ECE experience</label>
		<textarea
			id="f2s-experience"
			class="field"
			class:input-error={touched.f2sExperience && errors.f2sExperience}
			rows="3"
			placeholder="Describe any previous experience working with schools or ECEs..."
			bind:value={f2sExperience}
			onblur={() => (touched.f2sExperience = true)}
		></textarea>
		{#if touched.f2sExperience && errors.f2sExperience}
			<span class="error-text">{errors.f2sExperience}</span>
		{/if}
	</div>

	<div class="form-group">
		<span class="field-label">Interest in selling to schools/ECEs</span>
		{@render yesNo('interestedInF2s', interestedInF2s, (v) => (interestedInF2s = v))}
	</div>

	<div class="form-group">
		<label class="field-label" for="minimum-order">Minimum order for schools/ECEs</label>
		<input
			id="minimum-order"
			class="field"
			class:input-error={touched.minimumOrder && errors.minimumOrder}
			placeholder="e.g. $25 or $50"
			bind:value={minimumOrder}
			onblur={() => (touched.minimumOrder = true)}
		/>
		{#if touched.minimumOrder && errors.minimumOrder}
			<span class="error-text">{errors.minimumOrder}</span>
		{/if}
	</div>

	<div class="form-group">
		<span class="field-label">
			*Optional: Upload photos of your farm, operations, and/or products here. (Optional)
		</span>

		<FileUpload
			accept="image/*"
			maxFiles={10}
			acceptedFiles={selectedFiles}
			onFileChange={handleFileChange}
		>
			<FileUpload.Label class="sr-only">Upload farm images</FileUpload.Label>
			<FileUpload.Dropzone
				class="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8d8d8] bg-white p-6 text-center"
			>
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#131927"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 16V4" />
					<path d="M8 8l4-4 4 4" />
					<path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
				</svg>
				<FileUpload.Trigger
					class="cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-[#131927]"
				>
					Upload farm photos
				</FileUpload.Trigger>
				<span class="text-xs text-[#9aa0a6]">JPG or PNG, up to 10 MB each</span>
				<FileUpload.HiddenInput />
			</FileUpload.Dropzone>
		</FileUpload>

		{#if selectedFiles.length > 0}
			<ul class="file-list">
				{#each selectedFiles as file (file.name + file.size)}
					<li>
						<span class="file-name">{file.name}</span>
						<span class="file-size">{formatSize(file.size)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="submit-section">
		<button class="submit" type="button" onclick={handleSubmit}>Submit Farm Information</button>
		<button class="back-link" type="button">
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
			Back to Onboarding
		</button>
	</div>
</div>

<style>
	.container {
		font-family: 'DM Sans', sans-serif;
		max-width: 680px;
		margin: 0 auto;
		padding: 40px 24px 64px;
		color: #131927;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 28px;
	}

	.header h1 {
		font-size: 26px;
		font-weight: 600;
		margin: 0;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border: 1px solid #d8d8d8;
		border-radius: 8px;
		background: #fff;
		font-size: 14px;
		color: #131927;
		cursor: pointer;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		margin: 28px 0 16px;
	}

	.form-group {
		margin-bottom: 18px;
		display: flex;
		flex-direction: column;
	}

	.field-label {
		font-size: 14px;
		font-weight: 500;
		margin-bottom: 6px;
		color: #131927;
	}

	.field {
		width: 100%;
		box-sizing: border-box;
		padding: 12px 14px;
		border: 1px solid #d8d8d8;
		border-radius: 8px;
		background: #fff;
		font-size: 14px;
		font-family: inherit;
		color: #131927;
	}

	.field::placeholder {
		color: #9aa0a6;
	}

	.field:focus {
		outline: none;
		border-color: var(--mfsn-primary);
	}

	textarea.field {
		resize: vertical;
	}

	.input-error {
		border-color: #d23b3b;
	}

	.input-error:focus {
		border-color: #d23b3b;
	}

	.error-text {
		margin-top: 6px;
		font-size: 12px;
		color: #d23b3b;
	}

	.search-field {
		position: relative;
	}

	.search-field svg {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: #9aa0a6;
		pointer-events: none;
	}

	.search-field .field {
		padding-left: 40px;
	}

	.row {
		display: flex;
		gap: 20px;
	}

	.row .form-group {
		flex: 1;
	}

	.choice-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 4px;
	}

	.choice {
		display: flex;
		align-items: center;
		gap: 10px;
		width: fit-content;
		font-size: 14px;
		cursor: pointer;
	}

	.choice input {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: var(--mfsn-primary);
	}

	.group-error input {
		outline: 1.5px solid #d23b3b;
		outline-offset: 2px;
	}

	.file-list {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.file-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 12px;
		border: 1px solid #d8d8d8;
		border-radius: 6px;
		background: #fff;
		font-size: 14px;
	}

	.file-size {
		color: #666;
		font-size: 12px;
	}

	.submit-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		margin-top: 40px;
	}

	.submit {
		width: 360px;
		max-width: 100%;
		padding: 14px 24px;
		border: none;
		border-radius: 8px;
		background: var(--mfsn-primary);
		color: #fff;
		font-size: 15px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
	}

	.submit:hover {
		background: var(--mfsn-primary-hover);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: none;
		background: none;
		font-family: inherit;
		font-size: 14px;
		color: #444;
		cursor: pointer;
	}
</style>
