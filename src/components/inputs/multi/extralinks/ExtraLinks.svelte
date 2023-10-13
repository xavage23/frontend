<!--Wrapper around kv multi-input to provide a Link[]-->
<script lang="ts">
	import type { Link } from '$lib/generated/arcadia/Link';
	import KvMultiInput from '../kv/KVMultiInput.svelte';

	export let values: Link[] = [];

	let internalValues: [string, string][] = [];

	$: {
		values = internalValues.map(([k, v]) => ({ name: k, value: v })) || [];
	}
</script>

<KvMultiInput
	id="extra-links"
	bind:values={internalValues}
	title="Links"
	placeholder="Link"
	minlength={5}
/>
