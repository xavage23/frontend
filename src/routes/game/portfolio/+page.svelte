<script lang="ts">
	import { apiUrl } from '$lib/constants';
	import { fetchClient } from '$lib/fetch';
	import type { ApiError, Portfolio, PriorPricePoint, Stock, UserTransaction } from '$lib/generated';
    import { state } from '$lib/state';
	import Loading from '../../../components/Loading.svelte';
    import ErrorComponent from '../../../components/Error.svelte';
    import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables'
	import type { Readable } from 'svelte/store';
	import { centsToCurrency, title } from '$lib/strings';
	import Modal from '../../../components/Modal.svelte';
	import { getAveragePrice } from '$lib/stocks';
	import logger from '$lib/logger';

    interface PortfolioRow {
        stockId: string;
        amount: number;
        value: number;
        stockTicker: string;
        stockCompanyName: string;
        currentPrice: number;
        averagePrice: number;
        priorPrices: PriorPricePoint[];
        knownPrices: number[];
    }

    interface PortfolioStock {
        stock: Stock;
        amount: number;
    }

    let rows: Readable<PortfolioRow[]>;
    let selectedRow: PortfolioRow | undefined;
    let showModal: boolean = false;

    const fetchTransactions = async () => {
        let res = await fetchClient(`${apiUrl}/users/${$state?.user?.id}/games/${$state?.gameUser?.game_id}/portfolio`)

        if (!res.ok) {
            let err: ApiError = await res.json();
            throw new Error(`Failed to fetch portfolio: ${err?.message}`);
        }

        let portfolioData: { [key: string]: Portfolio } = await res.json();
        let portfolios = Object.values(portfolioData);

        logger.info('XavageBB', portfolios)

        const getAmountOfPortfolio = (p: Portfolio) => {
            let amount = 0;
            for(let [_, value] of Object.entries(p.amount)) {
                amount += value?.amount || 0;
            }

            return amount;
        }

        let trRow: PortfolioRow[] = portfolios
        .filter(p => getAmountOfPortfolio(p) != 0) // Only show stocks that one owns a quantity of
        .map(p => {
            let pAmount = getAmountOfPortfolio(p)
            return {
                stockId: p.stock?.id || '',
                amount: pAmount,
                value: (p?.stock?.current_price || 0) * pAmount,
                stockTicker: p.stock?.ticker || 'Unknown',
                stockCompanyName: p.stock?.company_name || 'Unknown',
                currentPrice: p.stock?.current_price || 0,
                averagePrice: p.stock ? getAveragePrice(p.stock) : 0,
                knownPrices: p.stock?.known_prices || [],
                priorPrices: p.stock?.prior_prices || [],
            }
        })

        const handler = new DataHandler(trRow, { rowsPerPage: 10 })
        rows = handler.getRows()

        return {
            portfolios,
            trRow,
            handler,
        }
    }
</script>

<svelte:head>
    <title>Portfolio</title>
</svelte:head>

<h1 class="text-4xl font-semibold">Portfolio</h1>

{#await fetchTransactions()}
    <Loading msg={"Loading"} disableHeader={true} />
{:then data}
    <Datatable handler={data.handler} search={false}>
        <table>
            <thead>
                <tr>
                    <Th handler={data.handler} orderBy="stockTicker">Ticker</Th>
                    <Th handler={data.handler} orderBy="stockCompanyName">Company Name</Th>
                    <Th handler={data.handler} orderBy="currentPrice">Current Price</Th>
                    <Th handler={data.handler} orderBy="averagePrice">Average Price</Th>
                    <Th handler={data.handler} orderBy="knownPrices">Price History</Th> <!--In reality, this includes prior prices -->
                    <Th handler={data.handler} orderBy="amount">Quantity</Th>
                    <Th handler={data.handler} orderBy="value">Value</Th>
                </tr>
                <tr>
                    <ThFilter handler={data.handler} filterBy="stockTicker"/>
                    <ThFilter handler={data.handler} filterBy="stockCompanyName"/>
                    <ThFilter handler={data.handler} filterBy="currentPrice"/>
                    <ThFilter handler={data.handler} filterBy="averagePrice"/>
                    <ThFilter handler={data.handler} filterBy="knownPrices"/>
                    <ThFilter handler={data.handler} filterBy="amount"/>
                    <ThFilter handler={data.handler} filterBy="value"/>
                </tr>
            </thead>
            <tbody>
                {#each $rows as row}
                    <tr>
                        <td>
                            <a class="text-blue-400 hover:text-blue-500" href={`/game/stocks/${row.stockTicker}`}>
                                {row.stockTicker}
                            </a>
                        </td>
                        <td>{row.stockCompanyName}</td>
                        <td>${centsToCurrency(row.currentPrice)}</td>
                        <td>${centsToCurrency(row.averagePrice)}</td>
                        <td>
                            <ul class="list-disc">
                                {#each row.knownPrices as price}
                                    <li>${centsToCurrency(price)}</li>
                                {/each}
                        </ul>
                            <button 
                                class="text-blue-400 hover:text-blue-500"
                                on:click={() => {
                                    selectedRow = row;
                                    showModal = true;
                                }}
                            >
                                History
                            </button>
                        </td>
                        <td>{row.amount}</td>
                        <td>
                            ${centsToCurrency(row.value)}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </Datatable>

    {#if showModal && selectedRow}
        <Modal bind:showModal>
            <h1 slot="header" class="font-semibold text-2xl">{selectedRow?.stockTicker} - {selectedRow?.stockCompanyName} Price History</h1>
            <ul>
                {#each selectedRow?.priorPrices as pp}
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
                        {#each selectedRow?.knownPrices as price}
                            <li>${centsToCurrency(price)}</li>
                        {/each}
                    </ul>
                </li>
            </ul>
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