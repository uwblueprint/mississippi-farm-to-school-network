<script lang="ts">
	import FarmCreateForm from '$lib/components/farm/FarmCreateForm.svelte';

	let { data } = $props();
</script>

<FarmCreateForm user={data.user} />
