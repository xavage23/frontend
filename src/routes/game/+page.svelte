<script lang="ts">
	import { state } from '$lib/state';
</script>

<div class="mt-14">
	<h1 class="text-3xl font-semibold">
		Hello, {$state?.user?.username}!
	</h1>
</div>
