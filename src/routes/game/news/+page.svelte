<script lang="ts">
	import { apiUrl } from '$lib/constants';
	import { fetchClient } from '$lib/fetch';
	import type { ApiError, News, PriorPricePoint, Stock } from '$lib/generated';
	import { state } from '$lib/state';
    import type { Readable } from 'svelte/store';
    import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables'
    import ErrorComponent from '../../../components/Error.svelte';
    import Loading from '../../../components/Loading.svelte';
	import Modal from '../../../components/Modal.svelte';
	import { centsToCurrency } from '$lib/strings';

    interface NewsRow {
        id: string;
        stockId?: string;
        stockTicker: string;
        stock?: Stock;
        knownPrices: number[];
        priorPrices?: PriorPricePoint[];
        title: string;
        description: string;
        showAt: number;
        showAtStr: string;
    }

    let rows: Readable<NewsRow[]>;
    let showModal: boolean = false;
    let selectedNewsRow: NewsRow | undefined;
    let selectedPriorPricesRow: Stock | undefined;

    const fetchNews = async () => {
        let gameEnabledDate = new Date($state?.gameUser?.game?.enabled || '');

        let res = await fetchClient(`${apiUrl}/users/${$state?.user?.id}/news?with_stocks=true`)

        if (!res.ok) {
            let err: ApiError = await res.json();
            throw new Error(`Failed to fetch news: ${err?.message}`);
        }

        let news: News[] = await res.json();

        let newsRows: NewsRow[] = (news || []).map(newsEntry => {
            return {
                id: newsEntry.id,
                stockId: newsEntry.affected_stock_id,
                stockTicker: newsEntry.affected_stock?.ticker || "General News",
                stock: newsEntry.affected_stock,
                knownPrices: newsEntry.affected_stock?.known_prices || [],
                priorPrices: newsEntry.affected_stock?.prior_prices,
                title: newsEntry.title,
                description: newsEntry.description,
                showAt: newsEntry.show_at,
                showAtStr: new Date(gameEnabledDate.getTime() + newsEntry.show_at*1000).toLocaleString()
            }
        })

        const handler = new DataHandler(newsRows, { rowsPerPage: 10 })
        handler.sortDesc("showAt")
        rows = handler.getRows()
        
        return {
            news,
            newsRows,
            handler
        }
    }
</script>

<svelte:head>
    <title>News</title>
</svelte:head>

<h1 class="text-4xl font-semibold">News</h1>

{#await fetchNews()}
    <Loading msg={"Loading"} disableHeader={true} />
{:then data}
    <Datatable handler={data.handler} search={false}>
        <table>
            <thead>
                <tr>
                    <Th handler={data.handler} orderBy="stockTicker">Ticker</Th>
                    <Th handler={data.handler} orderBy="title">Title</Th>
                    <Th handler={data.handler} orderBy="knownPrices">Price History</Th> <!--In reality, this includes prior prices -->
                    <Th handler={data.handler} orderBy="showAt">Time</Th>
                </tr>
                <tr>
                    <ThFilter handler={data.handler} filterBy="stockTicker" />
                    <ThFilter handler={data.handler} filterBy="title" />
                    <ThFilter handler={data.handler} filterBy="knownPrices" />
                    <ThFilter handler={data.handler} filterBy="showAt" />
                </tr>
            </thead>
            <tbody>
                {#each $rows as row}
                <tr>
                    <td>
                        {#if row.stock}
                            <a class="text-blue-400 hover:text-blue-500" href={`/game/stocks/${row.stockTicker}`}>
                                {row.stockTicker}
                            </a>
                        {:else}
                            General News
                        {/if}
                    </td>
                    <td>
                        <button 
                            class="text-blue-400 hover:text-blue-500"
                            on:click={() => {
                                selectedNewsRow = row;
                                selectedPriorPricesRow = undefined;
                                showModal = true;
                            }}
                        >
                            {row.title}
                        </button>
                    </td>
                    <td>
                        {#if row?.stock}
                            <ul class="list-disc">
                                {#each row.knownPrices as price}
                                    <li>${centsToCurrency(price)}</li>
                                {/each}
                            </ul>
                            <button 
                                class="text-blue-400 hover:text-blue-500"
                                on:click={() => {
                                    selectedPriorPricesRow = row?.stock;
                                    selectedNewsRow = undefined;
                                    showModal = true;
                                }}
                            >
                                History
                            </button>
                        {:else}
                            -
                        {/if}
                    </td>
                    <td>
                        {row.showAtStr}
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </Datatable>

    {#if showModal && selectedPriorPricesRow}
        <Modal bind:showModal>
            <h1 slot="header" class="font-semibold text-2xl">{selectedPriorPricesRow?.ticker} - {selectedPriorPricesRow?.company_name} Price History</h1>
            <ul>
                {#each (selectedPriorPricesRow?.prior_prices || []) as pp}
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
                        {#each (selectedPriorPricesRow?.known_prices || []) as price}
                            <li>${centsToCurrency(price)}</li>
                        {/each}
                    </ul>
                </li>
            </ul>
        </Modal>
    {/if}

    {#if showModal && selectedNewsRow}
    <Modal bind:showModal>
        <h1 slot="header" class="font-semibold text-2xl">{selectedNewsRow?.title}</h1>
        <p>
            {selectedNewsRow?.description}
        </p>
    </Modal>
    {/if}
{:catch err}
    <ErrorComponent msg={err?.toString()} />
{/await}

<style>
    table {
        color: white;
        width: 100%;
        margin: 0 !important;
    }
    tbody td {
        border: 1px solid #f5f5f5;
        padding: 4px 20px;
    }
    tbody tr {
        transition: all, 0.2s;
    }
    tbody tr:hover {
        background: #252323;
    }
</style>