<script lang="ts">
	import logo from '$lib/assets/favicon.svg';
	import MobileNavMenu from '$lib/components/MobileNavMenu.svelte';
	import { FARMER_NAV_ITEMS } from '$lib/components/Sidebar.svelte';

	/** Farmer portal's phone top bar + dropdown menu (hidden at 768px and up). */
	interface Props {
		profileName?: string;
		profileRole?: string;
		avatarUrl?: string;
	}

	let { profileName = 'Farmer', profileRole = 'Farmer', avatarUrl }: Props = $props();
</script>

<MobileNavMenu
	items={FARMER_NAV_ITEMS}
	logoSrc={logo}
	homeHref="/farmer/farms"
	{profileName}
	{profileRole}
	profileHref="/farmer/settings"
	{avatarUrl}
/>
