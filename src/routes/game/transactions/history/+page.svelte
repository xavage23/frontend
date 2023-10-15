<script lang="ts">
	import { apiUrl } from '$lib/constants';
	import { fetchClient } from '$lib/fetch';
	import type { ApiError, UserTransaction } from '$lib/generated';
    import { state } from '$lib/state';
	import Loading from '../../../../components/Loading.svelte';
    import ErrorComponent from '../../../../components/Error.svelte';
    import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables'
	import type { Readable } from 'svelte/store';
	import { centsToCurrency, title } from '$lib/strings';

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
        allPrices: number[];
        currentGain: number;
        priceSnapshot: number;
    }

    let rows: Readable<TransactionRow[]>;

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
            if ((tr?.stock?.all_prices || []).length < 2) return tr?.sale_price;

            let total = tr.stock?.all_prices.reduce((a, b) => a + b, 0) || 0;
            return total / (tr.stock?.all_prices || [0]).length;
        }

        let trRow: TransactionRow[] = transactions.map(tr => {
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
                allPrices: tr.stock?.all_prices || [],
                currentGain: getCurrentGain(tr),
                priceSnapshot: tr.price_index,
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

<h1 class="text-3xl font-semibold">Transaction History</h1>

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
                    <Th handler={data.handler} orderBy="stockPrice">Sale Price</Th>
                    <Th handler={data.handler} orderBy="currentPrice">Current Price</Th>
                    <Th handler={data.handler} orderBy="averagePrice">Average Price</Th>
                    <Th handler={data.handler} orderBy="allPrices">All Prices</Th>
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
                    <ThFilter handler={data.handler} filterBy="stockPrice"/>
                    <ThFilter handler={data.handler} filterBy="currentPrice"/>
                    <ThFilter handler={data.handler} filterBy="averagePrice"/>
                    <ThFilter handler={data.handler} filterBy="allPrices"/>
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
                        <td>${centsToCurrency(row.stockPrice)}</td>
                        <td>${centsToCurrency(row.currentPrice)}</td>
                        <td>${centsToCurrency(row.averagePrice)}</td>
                        <td>
                            <ul class="list-disc">
                                {#each row.allPrices as price}
                                    <li>${centsToCurrency(price)}</li>
                                {/each}
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