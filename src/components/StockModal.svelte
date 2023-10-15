<script lang="ts">
	import type { Stock, StockList } from "$lib/generated";
	import logger from "$lib/logger";
	import { onMount } from "svelte";
	import Modal from "./Modal.svelte";
	import { centsToCurrency } from "$lib/strings";
	import { apiUrl } from "$lib/constants";
	import { state } from "$lib/state";

    export let stock: Stock;
    export let showModal: boolean;
    let fetchingNewStock: boolean = false;

    onMount(() => {
        if(!stock?.prior_prices) {
            logger.error('XavageBB', 'Stock has no prior prices')
            fetchStock();
        }
    })

    const fetchStock = async () => {
        if(fetchingNewStock) return;
        fetchingNewStock = true;
        let res = await fetch(`${apiUrl}/users/${$state?.user?.id}/stocks?stock_id=${stock?.id}`);

        if(!res.ok) {
            throw new Error(`Failed to fetch stock: ${res.statusText}`);
        }

        let sl: StockList = await res.json();

        if(!sl.stocks?.length) {
            throw new Error(`Failed to fetch stock: ${res.statusText}`);
        }

        let stockPot = sl.stocks.find(s => s?.id == stock?.id);

        if(!stockPot) {
            throw new Error(`Failed to fetch stock: ${res.statusText}`);
        }

        stock = stockPot

        return stock;
    }
</script>

<Modal bind:showModal>
    <h1 slot="header" class="font-semibold text-3xl">{stock?.ticker}</h1>
    {#if fetchingNewStock}
        {#await fetchStock()}
            <p class="animate-pulse">We're currently fetching some more information on this stock. Certain information may be unavailable until this is complete</p>
        {:catch err}
            <p class="text-red-500">{err.message}</p>
        {/await}
    {/if}

    <h2 class="text-2xl">Ratios</h2>
    <p>Dummy ratios here</p>

    <h2 class="text-2xl">Description</h2>

    <p class="text-xl">{stock?.description}</p>

    <ul>
        <li>Company Name: {stock?.company_name}</li>
        <li>Current Price: ${centsToCurrency(stock?.current_price)}</li>
    </ul>

    <p class="text-2xl">Price History</p>

    {#if stock?.includes?.includes("prior_prices")}
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
    {/if}
</Modal>