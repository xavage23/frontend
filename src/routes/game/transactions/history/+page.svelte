<script lang="ts">
	import { apiUrl } from '$lib/constants';
	import { fetchClient } from '$lib/fetch';
	import type { ApiError, Game, PriorPricePoint, UserTransaction } from '$lib/generated';
    import { state } from '$lib/state';
	import Loading from '../../../../components/Loading.svelte';
    import ErrorComponent from '../../../../components/Error.svelte';
    import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables'
	import type { Readable } from 'svelte/store';
	import { centsToCurrency, title } from '$lib/strings';
	import Modal from '../../../../components/Modal.svelte';

    interface TransactionRow {
        id: string;
        action: string;
        userName: string;
        stockId: string;
        stockPrice: number;
        amount: number;
        totalCost: number;
        stockTicker: string;
        stockCompanyName: string;
        createdAt: string;
        currentPrice: number;
        averagePrice: number;
        priorPrices: PriorPricePoint[];
        knownPrices: number[];
        currentGain: number;
        priceSnapshot: number;
        isPast: boolean;
        originGameId: string;
    }

    interface GameCache {
        game?: Game;
        error?: string;
        fetched: boolean;
    }

    let rows: Readable<TransactionRow[]>;
    let pastGameCache: { [key: string]: GameCache } = {};
    let selectedSource: Game | undefined;
    let selectedRow: TransactionRow | undefined;
    let showModal: boolean = false;

    const fetchGame = async (gameId: string) => {
        if(pastGameCache?.[gameId]?.game && !pastGameCache?.[gameId]?.error && pastGameCache?.[gameId]?.fetched) {
            return pastGameCache[gameId]?.game;
        }

        let res = await fetchClient(`${apiUrl}/games/${gameId}`)

        if (!res.ok) {
            let err: ApiError = await res.json();
            throw new Error(`Failed to fetch game: ${err?.message}`);
        }

        let game: Game = await res.json();
        
        return game;
    }

    const fetchTransactions = async () => {
        let res = await fetchClient(`${apiUrl}/users/${$state?.user?.id}/transactions?include_users=true&with_prior_prices=true`)

        if (!res.ok) {
            let err: ApiError = await res.json();
            throw new Error(`Failed to fetch transactions: ${err?.message}`);
        }

        let transactions: UserTransaction[] = await res.json();

        const getCurrentGain = (tr: UserTransaction) => {
            return ((tr?.stock?.current_price || tr?.sale_price) - tr?.sale_price) * tr.amount;
        }

        const getAveragePrice = (tr: UserTransaction) => {
            // Take the prices and add them first
            let price = 0
            let numberOfPrices = 0;
            price += (tr.stock?.known_prices || []).reduce((a, b) => a + b);
            numberOfPrices += (tr.stock?.known_prices || []).length;

            // Next add prior prices
            for(let pp of tr.stock?.prior_prices || []) {
                price += pp.prices.reduce((a, b) => a + b);
                numberOfPrices += pp.prices.length;
            }

            return price / numberOfPrices;
        }

        let trRow: TransactionRow[] = transactions.map(tr => {
            if(tr.past && tr.origin_game_id) {
                if(!pastGameCache[tr.origin_game_id]) {
                    pastGameCache[tr.origin_game_id] = {
                        fetched: false,
                    }

                    fetchGame(tr.origin_game_id).catch(err => {
                        pastGameCache[tr.origin_game_id] = {
                            error: err?.toString() || 'Unknown error',
                            fetched: true,
                        }
                    }).then(game => {
                        if(game) {
                            pastGameCache[tr.origin_game_id] = {
                                game,
                                fetched: true,
                            }
                        }
                    });
                }
            }

            return {
                id: tr.id,
                action: tr.action,
                userName: tr.user?.username || 'Unknown',
                stockId: tr.stock_id,
                stockPrice: tr?.sale_price,
                amount: tr.amount,
                totalCost: tr?.sale_price * tr.amount,
                stockTicker: tr.stock?.ticker || 'Unknown',
                stockCompanyName: tr.stock?.company_name || 'Unknown',
                createdAt: new Date(tr.created_at).toLocaleString(),
                currentPrice: tr.stock?.current_price || 0,
                averagePrice: getAveragePrice(tr),
                knownPrices: tr.stock?.known_prices || [],
                priorPrices: tr.stock?.prior_prices || [],
                currentGain: getCurrentGain(tr),
                priceSnapshot: tr.price_index,
                isPast: tr.past,
                originGameId: tr.origin_game_id,
            }
        })

        const handler = new DataHandler(trRow, { rowsPerPage: 10 })
        rows = handler.getRows()

        return {
            transactions,
            trRow,
            handler,
        }
    }
</script>

<svelte:head>
    <title>Transaction History</title>
</svelte:head>

<h1 class="text-4xl font-semibold">Transaction History</h1>

{#await fetchTransactions()}
    <Loading msg={"Loading"} disableHeader={true} />
{:then data}
    <Datatable handler={data.handler} search={false}>
        <table>
            <thead>
                <tr>
                    <Th handler={data.handler} orderBy="stockTicker">Ticker</Th>
                    <Th handler={data.handler} orderBy="stockCompanyName">Company Name</Th>
                    <Th handler={data.handler} orderBy="action">Action</Th>
                    <Th handler={data.handler} orderBy="userName">User</Th>
                    <Th handler={data.handler} orderBy="priceSnapshot">Price Snapshot</Th>
                    <Th handler={data.handler} orderBy="isPast">From Prior Rounds</Th>
                    <Th handler={data.handler} orderBy="originGameId">Source</Th>
                    <Th handler={data.handler} orderBy="stockPrice">Sale Price</Th>
                    <Th handler={data.handler} orderBy="currentPrice">Current Price</Th>
                    <Th handler={data.handler} orderBy="averagePrice">Average Price</Th>
                    <Th handler={data.handler} orderBy="knownPrices">Price History</Th> <!--In reality, this includes prior prices-->
                    <Th handler={data.handler} orderBy="amount">Quantity</Th>
                    <Th handler={data.handler} orderBy="totalCost">Transaction Cost</Th>
                    <Th handler={data.handler} orderBy="currentGain">Potential Gain</Th>
                    <Th handler={data.handler} orderBy="createdAt">Transaction Date</Th>
                </tr>
                <tr>
                    <ThFilter handler={data.handler} filterBy="stockTicker"/>
                    <ThFilter handler={data.handler} filterBy="stockCompanyName"/>
                    <ThFilter handler={data.handler} filterBy="action"/>
                    <ThFilter handler={data.handler} filterBy="userName"/>
                    <ThFilter handler={data.handler} filterBy="priceSnapshot"/>
                    <ThFilter handler={data.handler} filterBy="isPast"/>
                    <ThFilter handler={data.handler} filterBy="originGameId"/>
                    <ThFilter handler={data.handler} filterBy="stockPrice"/>
                    <ThFilter handler={data.handler} filterBy="currentPrice"/>
                    <ThFilter handler={data.handler} filterBy="averagePrice"/>
                    <ThFilter handler={data.handler} filterBy="knownPrices"/>
                    <ThFilter handler={data.handler} filterBy="amount"/>
                    <ThFilter handler={data.handler} filterBy="totalCost"/>
                    <ThFilter handler={data.handler} filterBy="currentGain"/>
                    <ThFilter handler={data.handler} filterBy="createdAt"/>
                </tr>
            </thead>
            <tbody>
                {#each $rows as row}
                    <tr>
                        <td>
                            <a class="text-blue-400 hover:text-blue-500" href={`/game/stock/${row.stockTicker}`}>
                                {row.stockTicker}
                            </a>
                        </td>
                        <td>{row.stockCompanyName}</td>
                        <td>{title(row.action)}</td>
                        <td>{row.userName}</td>
                        <td>{row.priceSnapshot}</td>
                        <td>{row.isPast ? "Yes" : "No"}</td>
                        <td>
                            {#if row.isPast}
                                {#if pastGameCache?.[row.originGameId]?.fetched}
                                    {#if pastGameCache?.[row.originGameId]?.error}
                                        <li class="font-semibold">Error: {pastGameCache?.[row.originGameId]?.error}</li>
                                    {:else}
                                        <button 
                                            class="text-blue-400 hover:text-blue-500"
                                            on:click={() => {
                                                selectedSource = pastGameCache?.[row.originGameId]?.game
                                                selectedRow = undefined;
                                                showModal = true;
                                            }}
                                        >
                                            {pastGameCache?.[row.originGameId]?.game?.name}
                                        </button>
                                    {/if}
                                {:else}
                                    <p>Fetching source game...</p>
                                {/if}
                            {:else}
                                <button 
                                    class="text-blue-400 hover:text-blue-500"
                                    on:click={() => {
                                        selectedSource = $state?.gameUser?.game
                                        selectedRow = undefined;
                                        showModal = true;
                                    }}
                                >
                                    {$state?.gameUser?.game?.name}
                                </button>
                            {/if}
                        </td>
                        <td>${centsToCurrency(row.stockPrice)}</td>
                        <td>${centsToCurrency(row.currentPrice)}</td>
                        <td>${centsToCurrency(row.averagePrice)}</td>
                        <td>
                            <ul class="list-disc">
                                {#each row.knownPrices as price}
                                    <li>${centsToCurrency(price)}</li>
                                {/each}
                                <button 
                                    class="text-blue-400 hover:text-blue-500"
                                    on:click={() => {
                                        selectedRow = row;
                                        selectedSource = undefined;
                                        showModal = true;
                                    }}
                                >
                                    History
                                </button>
                            </ul>
                        </td>
                        <td>{row.amount}</td>
                        <td>
                            ${centsToCurrency(row.totalCost)} {row.action == "buy" ? "Paid" : "Gained"}
                        </td>
                        <td>${centsToCurrency(row.currentGain)}</td>
                        <td>
                            {row.createdAt}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </Datatable>

    {#if showModal && selectedSource}
        <Modal bind:showModal>
            <h1 slot="header" class="font-semibold text-2xl">{selectedSource?.name}</h1>
            <ul>
                <li><span class="font-semibold">Code:</span> {selectedSource?.code}</li>
                <li><span class="font-semibold">Initial Balance:</span> ${centsToCurrency(selectedSource?.initial_balance || 0)}</li>
                <li><span class="font-semibold">Game Number:</span> {selectedSource?.game_number}</li>
            </ul>
        </Modal>
    {/if}

    {#if showModal && selectedRow}
        <Modal bind:showModal>
            <h1 slot="header" class="font-semibold text-2xl">{selectedRow?.stockTicker} - {selectedRow?.stockCompanyName} Price History</h1>
            <ul>
                {#each selectedRow?.priorPrices as pp}
                    <li>
                        <h2 class="text-xl font-semibold">{pp.game.name}</h2>
                        <ul class="list-disc">
                            {#each pp.prices as price}
                                <li>${centsToCurrency(price)}</li>
                            {/each}
                        </ul>
                    </li>
                {/each}
                <li>
                    <h2 class="text-xl font-semibold">Current Game</h2>
                    <ul class="list-disc">
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