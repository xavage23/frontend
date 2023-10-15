<script lang="ts">
	import type { ApiError, Stock } from "$lib/generated";
	import { centsToCurrency } from "$lib/strings";
	import { apiUrl } from "$lib/constants";
	import { state } from "$lib/state";
	import { fetchClient } from "$lib/fetch";
	import { page } from "$app/stores";
	import Loading from "../../../../components/Loading.svelte";
    import ErrorComponent from "../../../../components/Error.svelte";


    const fetchStock = async () => {
        let res = await fetchClient(`${apiUrl}/users/${$state?.user?.id}/stocks/${$page.params.id}`);

        if(!res.ok) {
            let err: ApiError = await res.json();
            throw new Error(`Failed to fetch stock: ${err?.message}`);
        }

        let stock: Stock = await res.json();

        return stock;
    }
</script>

<svelte:head>
    <title>Stock Viewer</title>
</svelte:head>

{#await fetchStock()}
    <Loading msg="Loading stock..." disableHeader={true} />
{:then stock}
    <h1 class="font-semibold text-3xl">{stock?.ticker}</h1>
    <h2 class="text-2xl">Ratios</h2>
    <p>Dummy ratios here</p>

    <div class="mb-3"></div>

    <h2 class="text-2xl">Description</h2>

    <p class="text-xl">{stock?.description}</p>

    <ul>
        <li>Company Name: {stock?.company_name}</li>
        <li>Current Price: ${centsToCurrency(stock?.current_price)}</li>
    </ul>

    <p class="text-2xl">Price History</p>

    <ul>
        {#each stock?.prior_prices as pp}
            <li>
                <h2 class="text-xl font-semibold">{pp.game.name}</h2>
                <ul class="list-disc list-inside">
                    {#each pp.prices as price}
                        <li>${centsToCurrency(price)}</li>
                    {/each}
                </ul>
            </li>
        {/each}
        <li>
            <h2 class="text-xl font-semibold">Current Game</h2>
            <ul class="list-disc list-inside">
                {#each stock?.known_prices as price}
                    <li>${centsToCurrency(price)}</li>
                {/each}
            </ul>
        </li>
    </ul>
{:catch err}
    <ErrorComponent msg={err?.toString()} />
{/await}
