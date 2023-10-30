<script lang="ts">
	import type { StockRatio } from "$lib/generated";

    export let ratio: StockRatio;
</script>
<span class="font-semibold">{ratio?.name}:</span> {ratio?.value?.toFixed(2)} 

{#if ratio?.value_text}
    <span class="italic">({ratio?.value_text})</span>
{/if}
