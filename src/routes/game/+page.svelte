<script lang="ts">
	import { authState } from '$lib/authState';
	import { apiUrl } from '$lib/constants';
	import { fetchClient } from '$lib/fetch';
	import type { ApiError, Stock, StockList } from '$lib/generated';
	import type { Readable } from 'svelte/store';
	import ErrorComponent from '../../components/Error.svelte';
	import Loading from '../../components/Loading.svelte';
	import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables'
	import { centsToCurrency } from '$lib/strings';
	import StockModal from '../../components/StockModal.svelte';

	let showModal: boolean;
	let showStock: Stock | undefined

    interface StockRow {
        id: string;
		stockTicker: string;
        stockCompanyName: string;
        stockPrice: number;
		stock: Stock | undefined;
        priceSnapshot: number;
    }

	let rows: Readable<StockRow[]>;

	const getStockList = async () => {
		let res = await fetchClient(`${apiUrl}/users/${$authState?.userId}/stocks`)

		if (!res.ok) {
			let err: ApiError = await res.json();
			throw new Error(`Failed to fetch stocks: ${err?.message}`);
		}

		let stocks: StockList = await res.json();

		if(!stocks.stocks?.length) {
			let stocksRows: StockRow[] = [];
			const handler = new DataHandler(stocksRows, { rowsPerPage: 10 })
        	rows = handler.getRows()
			stocks.stocks = []
			return {
				stocks,
				stocksRows,
				handler
			}
		}

        let stocksRows: StockRow[] = stocks.stocks.map(stock => {
            return {
                id: stock?.id || '',
				stockTicker: stock?.ticker || '',
				stockCompanyName: stock?.company_name || '',
				stockPrice: stock?.current_price || 0,
				stock,
				priceSnapshot: stocks.price_index
            }
        })

		const handler = new DataHandler(stocksRows, { rowsPerPage: 10 })
        rows = handler.getRows()

        return {
            stocks,
            stocksRows,
            handler,
        }
	}
</script>

<svelte:head>
    <title>Stocks</title>
</svelte:head>

<h1 class="text-4xl font-semibold">Stocks</h1>

{#await getStockList()}
    <Loading msg={"Loading"} disableHeader={true} />
{:then data}
	<Datatable handler={data.handler} search={false}>
        <table>
            <thead>
				<tr>
                    <Th handler={data.handler} orderBy="stockTicker">Ticker</Th>
                    <Th handler={data.handler} orderBy="stockCompanyName">Company Name</Th>
                    <Th handler={data.handler} orderBy="stockPrice">Price</Th>
					<Th handler={data.handler} orderBy="priceSnapshot">Price Snapshot</Th>
				</tr>
				<tr>
					<ThFilter handler={data.handler} filterBy="stockTicker"/>
					<ThFilter handler={data.handler} filterBy="stockCompanyName"/>
					<ThFilter handler={data.handler} filterBy="stockPrice"/>
					<ThFilter handler={data.handler} filterBy="priceSnapshot"/>
				</tr>
			</thead>
            <tbody>
                {#each $rows as row}
					{#if row.id}
						<tr>
							<td>
								<button 
									class="text-blue-400 hover:text-blue-500"
									on:click={() => {
										showStock = row.stock
										showModal = true
									}}
								>
									{row.stockTicker}
								</button>
							</td>
							<td>{row.stockCompanyName}</td>
							<td>${centsToCurrency(row.stockPrice)}</td>
							<td>{row.priceSnapshot}</td>
						</tr>
					{/if}
				{/each}
		</table>
	</Datatable>
{:catch err}
    <ErrorComponent msg={err?.toString()} />
{/await}

{#if showModal && showStock}
	<StockModal stock={showStock} bind:showModal />
{/if}

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