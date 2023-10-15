<script lang="ts">
	export let msg: string;
</script>

<section>
	<h3 aria-live="polite" class="text-center text-red-500 text-xl font-semibold mt-4">
		Error
	</h3>
	<p class="mt-3 font-semibold text-center text-red-400">{msg}</p>
</section>
