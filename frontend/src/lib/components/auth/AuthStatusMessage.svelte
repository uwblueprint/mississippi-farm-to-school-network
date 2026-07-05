<script lang="ts">
	interface Props {
		message: string;
		variant?: 'error' | 'success';
	}

	let { message, variant = 'error' }: Props = $props();
</script>

<p
	class="auth-status"
	class:auth-status--error={variant === 'error'}
	class:auth-status--success={variant === 'success'}
	role={variant === 'success' ? 'status' : 'alert'}
>
	{message}
</p>
