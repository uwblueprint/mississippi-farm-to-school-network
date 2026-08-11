<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		label: string;
	}

	let { value = $bindable(''), placeholder = 'Search', label }: Props = $props();
</script>

<div class="admin-search">
	<img class="admin-search__icon" src="/images/admin/searchIcon.svg" alt="" />
	<input class="admin-search__input" type="search" aria-label={label} {placeholder} bind:value />
</div>
