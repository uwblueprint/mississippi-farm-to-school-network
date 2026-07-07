<script lang="ts">
	import { untrack } from 'svelte';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	interface AddressSuggestion {
		formatted: string;
		lat: number | null;
		lon: number | null;
		placeId: string;
	}

	let usdaFarmId = $state('');
	let farmName = $state('');
	let farmAddress = $state('');
	let addressFocused = $state(false);
	let addressLoading = $state(false);
	let addressSuggestions = $state<AddressSuggestion[]>([]);
	let addressLat = $state<number | null>(null);
	let addressLng = $state<number | null>(null);
	let addressTimer: ReturnType<typeof setTimeout> | undefined;
	let county = $state('');
	let countyFocused = $state(false);

	let phone = $state(untrack(() => data.user?.phone ?? ''));
	let email = $state(untrack(() => data.user?.email ?? ''));
	let instagram = $state('');
	let facebook = $state('');
	let website = $state('');
	let otherSocial = $state('');

	let growingPractices = $state<string[]>([]);
	let productCategories = $state<string[]>([]);
	let specificProducts = $state('');
	let foodSafetyCertifications = $state<string[]>([]);
	let farmExperiences = $state<string[]>([]);
	let farmCharacteristics = $state<string[]>([]);
	let farmToSchoolSales = $state<string[]>([]);
	let f2sExperience = $state('');
	let minimumOrder = $state('');
	let deliveryDetails = $state('');

	let coverPhoto = $state<File[]>([]);
	let carouselPhotos = $state<File[]>([]);

	const NONE = 'None of the above';
	const DELIVERY_AVAILABLE = 'Delivery Available';

	const GROWING_PRACTICES = [
		'Organic Practices',
		'Conventional',
		'Regenerative',
		'Hydroponic',
		'Aquaponic',
		'Biodynamic'
	];
	const PRODUCT_CATEGORIES = [
		'Dairy and Eggs',
		'Fruits and Vegetables',
		'Herbs',
		'Meat (Beef, Poultry, Fish)',
		'Other (Honey, Mushrooms, Flowers, Seedlings & Plants, Grains, Value-Added Products)'
	];
	const FOOD_SAFETY_CERTIFICATIONS = [
		'Food Safety Plan in Place',
		'GAP Certified',
		'Certified Organic',
		'Certified Naturally Grown'
	];
	const FARM_EXPERIENCES = [
		'CSA (Community Supported Agriculture) Available',
		'U-Pick Available',
		'Farm Stand On-Site',
		'Farm Tours/Field Trips Welcome',
		'Equipment Rental Available'
	];
	const FARM_CHARACTERISTICS = [
		'BIPOC-Owned Farm',
		'Veteran-Owned Farm',
		'Woman-Owned Farm',
		'Multi-Generational Farm',
		'Beginning Farmer (10 years or less in farming)',
		'Young Farmer (Age 40 or Under)'
	];
	const FARM_TO_SCHOOL_SALES = [
		'Interested in Selling to K-12 Schools',
		'Interested in Selling to Early Care and Education Programs',
		'Online Ordering Available',
		'Delivery Available'
	];

	const MS_COUNTIES = [
		'Adams',
		'Alcorn',
		'Amite',
		'Attala',
		'Benton',
		'Bolivar',
		'Calhoun',
		'Carroll',
		'Chickasaw',
		'Choctaw',
		'Claiborne',
		'Clarke',
		'Clay',
		'Coahoma',
		'Copiah',
		'Covington',
		'DeSoto',
		'Forrest',
		'Franklin',
		'George',
		'Greene',
		'Grenada',
		'Hancock',
		'Harrison',
		'Hinds',
		'Holmes',
		'Humphreys',
		'Issaquena',
		'Itawamba',
		'Jackson',
		'Jasper',
		'Jefferson',
		'Jefferson Davis',
		'Jones',
		'Kemper',
		'Lafayette',
		'Lamar',
		'Lauderdale',
		'Lawrence',
		'Leake',
		'Lee',
		'Leflore',
		'Lincoln',
		'Lowndes',
		'Madison',
		'Marion',
		'Marshall',
		'Monroe',
		'Montgomery',
		'Neshoba',
		'Newton',
		'Noxubee',
		'Oktibbeha',
		'Panola',
		'Pearl River',
		'Perry',
		'Pike',
		'Pontotoc',
		'Prentiss',
		'Quitman',
		'Rankin',
		'Scott',
		'Sharkey',
		'Simpson',
		'Smith',
		'Stone',
		'Sunflower',
		'Tallahatchie',
		'Tate',
		'Tippah',
		'Tishomingo',
		'Tunica',
		'Union',
		'Walthall',
		'Warren',
		'Washington',
		'Wayne',
		'Webster',
		'Wilkinson',
		'Winston',
		'Yalobusha',
		'Yazoo'
	];

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

	let touched = $state<Record<string, boolean>>({});

	const filteredCounties = $derived(
		MS_COUNTIES.filter((name) => name.toLowerCase().includes(county.trim().toLowerCase()))
	);

	const f2sSelected = $derived(farmToSchoolSales.length > 0);
	const deliverySelected = $derived(farmToSchoolSales.includes(DELIVERY_AVAILABLE));

	const errors = $derived({
		usdaFarmId: usdaFarmId.trim() === '' ? 'Farm ID is required.' : '',
		farmName: farmName.trim() === '' ? 'Farm name is required.' : '',
		farmAddress: farmAddress.trim() === '' ? 'Farm address is required.' : '',
		county: county.trim() === '' ? 'County is required.' : '',
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
		website: website.trim() !== '' && !urlPattern.test(website.trim()) ? 'Enter a valid URL.' : '',
		growingPractices: growingPractices.length === 0 ? 'Select at least one growing practice.' : '',
		productCategories:
			productCategories.length === 0 ? 'Select at least one product category.' : '',
		specificProducts: specificProducts.trim() === '' ? 'This field is required.' : '',
		foodSafetyCertifications:
			foodSafetyCertifications.length === 0 ? 'Select at least one option.' : '',
		f2sExperience: f2sSelected && f2sExperience.trim() === '' ? 'This field is required.' : '',
		minimumOrder: f2sSelected && minimumOrder.trim() === '' ? 'Minimum order is required.' : '',
		deliveryDetails:
			deliverySelected && deliveryDetails.trim() === '' ? 'This field is required.' : ''
	});

	const isValid = $derived(Object.values(errors).every((message) => message === ''));

	function digitsOnly(value: string) {
		return value.replace(/\D/g, '');
	}

	function handlePhoneInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const cleaned = digitsOnly(input.value).slice(0, 10);
		phone = cleaned;
		input.value = cleaned;
	}

	function handleMinimumOrderInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const cleaned = digitsOnly(input.value);
		minimumOrder = cleaned;
		input.value = cleaned;
	}

	function toggleInGroup(current: string[], option: string, checked: boolean, hasNone: boolean) {
		if (hasNone && option === NONE) {
			return checked ? [NONE] : [];
		}
		let next = checked ? [...current, option] : current.filter((item) => item !== option);
		if (hasNone) {
			next = next.filter((item) => item !== NONE);
		}
		return next;
	}

	function handleAddressInput() {
		addressFocused = true;
		addressLat = null;
		addressLng = null;

		if (addressTimer) {
			clearTimeout(addressTimer);
		}

		const query = farmAddress.trim();

		if (query.length < 3) {
			addressSuggestions = [];
			addressLoading = false;
			return;
		}

		addressLoading = true;
		addressTimer = setTimeout(() => fetchAddressSuggestions(query), 300);
	}

	async function fetchAddressSuggestions(query: string) {
		try {
			const res = await fetch(`/api/address-autocomplete?text=${encodeURIComponent(query)}`);

			if (!res.ok) {
				addressSuggestions = [];
				return;
			}

			const data = await res.json();
			addressSuggestions = data.results ?? [];
		} catch {
			addressSuggestions = [];
		} finally {
			addressLoading = false;
		}
	}

	function selectAddress(suggestion: AddressSuggestion) {
		farmAddress = suggestion.formatted;
		addressLat = suggestion.lat;
		addressLng = suggestion.lon;
		addressSuggestions = [];
		addressFocused = false;
		touched.farmAddress = true;
	}

	function selectCounty(name: string) {
		county = name;
		countyFocused = false;
		touched.county = true;
	}

	function handleCoverChange(details: { acceptedFiles: File[] }) {
		coverPhoto = details.acceptedFiles;
	}

	function handleCarouselChange(details: { acceptedFiles: File[] }) {
		carouselPhotos = details.acceptedFiles;
	}

	function buildFarmPayload() {
		const socialMedia: Record<string, string> = {};
		if (instagram.trim()) socialMedia.instagram = instagram.trim();
		if (facebook.trim()) socialMedia.facebook = facebook.trim();
		if (otherSocial.trim()) socialMedia.other = otherSocial.trim();

		return {
			usda_farm_id: usdaFarmId.trim(),
			farm_name: farmName.trim(),
			specific_products: specificProducts.trim(),
			primary_phone: phone,
			primary_email: email.trim(),
			website: website.trim() || null,
			social_media: Object.keys(socialMedia).length > 0 ? socialMedia : null,
			farm_address: farmAddress.trim(),
			county: county.trim(),
			location: { lat: addressLat, lng: addressLng },
			product_categories: productCategories,
			growing_practices: growingPractices,
			food_safety_certifications: foodSafetyCertifications,
			farm_experiences: farmExperiences,
			farm_characteristics: farmCharacteristics,
			farm_to_school_sales: farmToSchoolSales,
			f2s_experience: f2sSelected ? f2sExperience.trim() || null : null,
			minimum_order: f2sSelected && minimumOrder.trim() !== '' ? Number(minimumOrder) : null,
			delivery_details: deliverySelected ? deliveryDetails.trim() || null : null,
			cover_photo: coverPhoto[0]?.name ?? null,
			carousel_photos: carouselPhotos.map((file) => file.name)
		};
	}

	function handleSubmit() {
		for (const key of Object.keys(errors)) {
			touched[key] = true;
		}
		if (!isValid) return;

		const payload = buildFarmPayload();
		console.log('createFarm payload', payload);
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

{#snippet checkboxGroup(
	field: string,
	options: string[],
	selected: string[],
	set: (next: string[]) => void,
	hasNone: boolean
)}
	<div
		class="choice-list"
		class:group-error={touched[field] && errors[field as keyof typeof errors]}
	>
		{#each options as option}
			<label class="choice">
				<input
					type="checkbox"
					checked={selected.includes(option)}
					onchange={(e) => {
						set(toggleInGroup(selected, option, e.currentTarget.checked, hasNone));
						touched[field] = true;
					}}
				/>
				<span>{option}</span>
			</label>
		{/each}
		{#if hasNone}
			<label class="choice">
				<input
					type="checkbox"
					checked={selected.includes(NONE)}
					onchange={(e) => {
						set(toggleInGroup(selected, NONE, e.currentTarget.checked, hasNone));
						touched[field] = true;
					}}
				/>
				<span>{NONE}</span>
			</label>
		{/if}
	</div>
	{#if touched[field] && errors[field as keyof typeof errors]}
		<span class="error-text">{errors[field as keyof typeof errors]}</span>
	{/if}
{/snippet}

{#snippet fileList(files: File[])}
	{#if files.length > 0}
		<ul class="file-list">
			{#each files as file (file.name + file.size)}
				<li>
					<span class="file-name">{file.name}</span>
					<span class="file-size">{formatSize(file.size)}</span>
				</li>
			{/each}
		</ul>
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
		<label class="field-label" for="usda-farm-id">Government Issued Farm ID</label>
		<input
			id="usda-farm-id"
			class="field"
			class:input-error={touched.usdaFarmId && errors.usdaFarmId}
			placeholder="e.g. 32486126374"
			bind:value={usdaFarmId}
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
		<label class="field-label" for="farm-address">Farm Address</label>
		<div class="combobox">
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
					autocomplete="off"
					bind:value={farmAddress}
					oninput={handleAddressInput}
					onfocus={() => (addressFocused = true)}
					onblur={() => {
						touched.farmAddress = true;
						addressFocused = false;
					}}
				/>
			</div>
			{#if addressFocused && (addressLoading || addressSuggestions.length > 0)}
				<ul class="combobox-list">
					{#if addressLoading && addressSuggestions.length === 0}
						<li class="combobox-empty">Searching…</li>
					{/if}
					{#each addressSuggestions as suggestion (suggestion.placeId)}
						<li>
							<button
								type="button"
								class="combobox-option"
								onmousedown={(e) => {
									e.preventDefault();
									selectAddress(suggestion);
								}}
							>
								{suggestion.formatted}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if touched.farmAddress && errors.farmAddress}
			<span class="error-text">{errors.farmAddress}</span>
		{/if}
	</div>

	<div class="form-group">
		<label class="field-label" for="county">County it is located in</label>
		<div class="combobox">
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
					id="county"
					class="field"
					class:input-error={touched.county && errors.county}
					placeholder="Start typing your county"
					autocomplete="off"
					bind:value={county}
					oninput={() => (countyFocused = true)}
					onfocus={() => (countyFocused = true)}
					onblur={() => {
						touched.county = true;
						countyFocused = false;
					}}
				/>
			</div>
			{#if countyFocused && filteredCounties.length > 0}
				<ul class="combobox-list">
					{#each filteredCounties as name}
						<li>
							<button
								type="button"
								class="combobox-option"
								onmousedown={(e) => {
									e.preventDefault();
									selectCounty(name);
								}}
							>
								{name}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if touched.county && errors.county}
			<span class="error-text">{errors.county}</span>
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

	<div class="row">
		<div class="form-group">
			<label class="field-label" for="instagram"
				>Instagram <span class="optional">(Optional)</span></label
			>
			<input
				id="instagram"
				class="field"
				placeholder="e.g. @twobrooksfarm"
				bind:value={instagram}
			/>
		</div>

		<div class="form-group">
			<label class="field-label" for="facebook"
				>Facebook <span class="optional">(Optional)</span></label
			>
			<input
				id="facebook"
				class="field"
				placeholder="e.g. facebook.com/twobrooksfarm"
				bind:value={facebook}
			/>
		</div>
	</div>

	<div class="row">
		<div class="form-group">
			<label class="field-label" for="website"
				>Website URL <span class="optional">(Optional)</span></label
			>
			<input
				id="website"
				class="field"
				class:input-error={touched.website && errors.website}
				placeholder="e.g. https://twobrooksfarm.com"
				bind:value={website}
				onblur={() => (touched.website = true)}
			/>
			{#if touched.website && errors.website}
				<span class="error-text">{errors.website}</span>
			{/if}
		</div>

		<div class="form-group">
			<label class="field-label" for="other-social">
				Other Social Media <span class="optional">(Optional)</span>
			</label>
			<input
				id="other-social"
				class="field"
				placeholder="e.g. X: @twobrooksfarm"
				bind:value={otherSocial}
			/>
		</div>
	</div>

	<h2 class="section-title">Farm Profile</h2>

	<div class="form-group">
		<span class="field-label">Growing Practices</span>
		{@render checkboxGroup(
			'growingPractices',
			GROWING_PRACTICES,
			growingPractices,
			(next) => (growingPractices = next),
			true
		)}
	</div>

	<div class="form-group">
		<span class="field-label">Product Categories Offered</span>
		{@render checkboxGroup(
			'productCategories',
			PRODUCT_CATEGORIES,
			productCategories,
			(next) => (productCategories = next),
			false
		)}
	</div>

	<div class="form-group">
		<label class="field-label" for="specific-products">Specific Products</label>
		<textarea
			id="specific-products"
			class="field"
			class:input-error={touched.specificProducts && errors.specificProducts}
			rows="3"
			placeholder="Enter the specific product items you offer on your farm"
			bind:value={specificProducts}
			onblur={() => (touched.specificProducts = true)}
		></textarea>
		{#if touched.specificProducts && errors.specificProducts}
			<span class="error-text">{errors.specificProducts}</span>
		{/if}
	</div>

	<div class="form-group">
		<span class="field-label">Food Safety + Certifications</span>
		{@render checkboxGroup(
			'foodSafetyCertifications',
			FOOD_SAFETY_CERTIFICATIONS,
			foodSafetyCertifications,
			(next) => (foodSafetyCertifications = next),
			true
		)}
	</div>

	<div class="form-group">
		<span class="field-label"
			>Farm Experiences + Services <span class="optional">(Optional)</span></span
		>
		{@render checkboxGroup(
			'farmExperiences',
			FARM_EXPERIENCES,
			farmExperiences,
			(next) => (farmExperiences = next),
			false
		)}
	</div>

	<div class="form-group">
		<span class="field-label">Farm Characteristics <span class="optional">(Optional)</span></span>
		{@render checkboxGroup(
			'farmCharacteristics',
			FARM_CHARACTERISTICS,
			farmCharacteristics,
			(next) => (farmCharacteristics = next),
			false
		)}
	</div>

	<div class="form-group">
		<span class="field-label">Farm to School Sales <span class="optional">(Optional)</span></span>
		{@render checkboxGroup(
			'farmToSchoolSales',
			FARM_TO_SCHOOL_SALES,
			farmToSchoolSales,
			(next) => (farmToSchoolSales = next),
			false
		)}
	</div>

	{#if f2sSelected}
		<div class="form-group">
			<label class="field-label" for="f2s-experience"
				>Previous Farm to School or ECE experience</label
			>
			<textarea
				id="f2s-experience"
				class="field"
				class:input-error={touched.f2sExperience && errors.f2sExperience}
				rows="3"
				placeholder="N/A"
				bind:value={f2sExperience}
				onblur={() => (touched.f2sExperience = true)}
			></textarea>
			{#if touched.f2sExperience && errors.f2sExperience}
				<span class="error-text">{errors.f2sExperience}</span>
			{/if}
		</div>

		<div class="form-group">
			<label class="field-label" for="minimum-order">Minimum order for schools/ECEs</label>
			<input
				id="minimum-order"
				class="field"
				class:input-error={touched.minimumOrder && errors.minimumOrder}
				inputmode="numeric"
				placeholder="30"
				value={minimumOrder}
				oninput={handleMinimumOrderInput}
				onblur={() => (touched.minimumOrder = true)}
			/>
			{#if touched.minimumOrder && errors.minimumOrder}
				<span class="error-text">{errors.minimumOrder}</span>
			{/if}
		</div>
	{/if}

	{#if deliverySelected}
		<div class="form-group">
			<label class="field-label" for="delivery-details"
				>Delivery details (area, fees, minimums)</label
			>
			<textarea
				id="delivery-details"
				class="field"
				class:input-error={touched.deliveryDetails && errors.deliveryDetails}
				rows="3"
				placeholder="Minimum order amount of $30"
				bind:value={deliveryDetails}
				onblur={() => (touched.deliveryDetails = true)}
			></textarea>
			{#if touched.deliveryDetails && errors.deliveryDetails}
				<span class="error-text">{errors.deliveryDetails}</span>
			{/if}
		</div>
	{/if}

	<div class="form-group">
		<span class="field-label">Display Photo <span class="optional">(Optional)</span></span>
		<p class="field-help">
			The image you upload here will be the cover image child nutrition directors, community
			members, and educators will see when browsing farms on the Mississippi Farm Fresh Map.
		</p>

		<FileUpload
			accept="image/*"
			maxFiles={1}
			acceptedFiles={coverPhoto}
			onFileChange={handleCoverChange}
		>
			<FileUpload.Label class="sr-only">Upload cover photo</FileUpload.Label>
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
					Upload cover photo
				</FileUpload.Trigger>
				<span class="text-xs text-[#9aa0a6]">JPG or PNG, up to 10 MB</span>
				<FileUpload.HiddenInput />
			</FileUpload.Dropzone>
		</FileUpload>

		{@render fileList(coverPhoto)}
	</div>

	<div class="form-group">
		<span class="field-label">Photo Carousel <span class="optional">(Optional)</span></span>
		<p class="field-help">
			Add up to 10 photos of your farm, operations, and products for educators to browse.
		</p>

		<FileUpload
			accept="image/*"
			maxFiles={10}
			acceptedFiles={carouselPhotos}
			onFileChange={handleCarouselChange}
		>
			<FileUpload.Label class="sr-only">Upload farm photos</FileUpload.Label>
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

		{@render fileList(carouselPhotos)}
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

	.optional {
		color: #9aa0a6;
		font-weight: 400;
	}

	.field-help {
		margin: 0 0 8px;
		font-size: 13px;
		color: #666;
		line-height: 1.4;
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

	.combobox {
		position: relative;
	}

	.combobox-list {
		position: absolute;
		z-index: 5;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: 220px;
		overflow-y: auto;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: #fff;
		border: 1px solid #d8d8d8;
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(20, 28, 16, 0.12);
	}

	.combobox-option {
		display: block;
		width: 100%;
		text-align: left;
		padding: 8px 10px;
		border: none;
		border-radius: 6px;
		background: none;
		font-family: inherit;
		font-size: 14px;
		color: #131927;
		cursor: pointer;
	}

	.combobox-option:hover {
		background: var(--mfsn-primary-tint, #f0f5ec);
	}

	.combobox-empty {
		padding: 8px 10px;
		font-size: 14px;
		color: #9aa0a6;
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

	.choice input[type='checkbox'] {
		appearance: none;
		-webkit-appearance: none;
		display: inline-grid;
		place-content: center;
		flex-shrink: 0;
		width: 16px;
		height: 16px;
		margin: 0;
		border: 1px solid #9ea0ad;
		border-radius: 2px;
		background: #fff;
		cursor: pointer;
		transition:
			background-color 120ms ease,
			border-color 120ms ease;
	}

	.choice input[type='checkbox']::before {
		content: '';
		width: 10px;
		height: 10px;
		transform: scale(0);
		transition: transform 120ms ease;
		background: #fff;
		clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
	}

	.choice input[type='checkbox']:hover {
		background: #e2e8d9;
	}

	.choice input[type='checkbox']:checked {
		background: #455d32;
		border-color: #455d32;
	}

	.choice input[type='checkbox']:checked::before {
		transform: scale(1);
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
