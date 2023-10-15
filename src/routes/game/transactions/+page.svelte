<script lang="ts">
	import { authState } from "$lib/authState";
	import { apiUrl } from "$lib/constants";
	import { fetchClient } from "$lib/fetch";
	import type { ApiError, CreateTransaction, StockList } from "$lib/generated";
	import { state } from "$lib/state";
	import { centsToCurrency } from "$lib/strings";
	import { error, success } from "$lib/toast";
    import ErrorComponent from '../../../components/Error.svelte';
	import Loading from '../../../components/Loading.svelte';
	import ButtonReact from "../../../components/button/ButtonReact.svelte";
	import { Color } from "../../../components/button/colors";
	import InputNumber from "../../../components/inputs/InputNumber.svelte";
	import Label from "../../../components/inputs/Label.svelte";

    let selectedStockId = '';
    let selectedAction = '';
    let selectedAmount = 0;

    const getTransactionMeta = async () => {
		let res = await fetchClient(`${apiUrl}/users/${$authState?.userId}/stocks`)

		if (!res.ok) {
			let err: ApiError = await res.json();
			throw new Error(`Failed to fetch stocks: ${err?.message}`);
		}

		let stocks: StockList = await res.json();

        return {
            stocks,
        }
    }

    const stockValue = (stocks: StockList, stockId: string, amount: number) => {
        let stock = stocks.stocks.find(s => s?.id == stockId);
        if (!stock) return 0;
        return stock.current_price * amount;
    }

    const resultantBalance = (stocks: StockList, stockId: string, amount: number, action: string) => {
        let stockV = stockValue(stocks, stockId, amount);

        switch (action) {
            case "buy":
                return ($state?.gameUser?.current_balance || 0) - stockV;
            case "sell":
                return ($state?.gameUser?.current_balance || 0) + stockV;
            default:
                return $state?.gameUser?.current_balance || 0;
        }
    }

    const createTransaction = async () => {
        let ct: CreateTransaction = {
            stock_id: selectedStockId,
            action: selectedAction,
            amount: selectedAmount,
        }
        
        let res = await fetchClient(`${apiUrl}/users/${$authState?.userId}/transactions`, {
            method: "POST",
            body: JSON.stringify(ct)
        })

        if (!res.ok) {
            let err: ApiError = await res.json();
            error(`Failed to create transaction: ${err?.message}`);
            return false
        }

        success("Transaction created successfully")
        return true
    }
</script>

<svelte:head>
    <title>Transactions</title>
</svelte:head>

<h1 class="text-3xl font-semibold">Transactions</h1>

{#await getTransactionMeta()}
    <Loading msg={"Loading"} disableHeader={true} />
{:then data}
    <div class="mt-3"></div>
    <Label id="stock-select" label="Stock" />
    <div class="mb-1"></div>
    <select
        id="stock-select"
        name="stock-select"
        class="w-full mx-auto flex transition duration-200 hover:bg-gray-800 bg-gray-700 bg-opacity-100 text-white focus:text-themable-400 rounded-xl border border-white/10 focus:border-themable-400 focus:outline-none py-4 px-6"
        bind:value={selectedStockId}
    >
        <option value="" tabindex={0}>Select a stock</option>
        {#each data.stocks.stocks as stock}
            {#if stock}
                <option value={stock.id}>{stock.company_name} - {stock.ticker}</option>
            {/if}
        {/each}
    </select>

    <div class="mt-3"></div>
    <Label id="action-select" label="Action" />
    <div class="mb-1"></div>
    <select
        id="action-select"
        name="action-select"
        class="w-full mx-auto flex transition duration-200 hover:bg-gray-800 bg-gray-700 bg-opacity-100 text-white focus:text-themable-400 rounded-xl border border-white/10 focus:border-themable-400 focus:outline-none py-4 px-6"
        bind:value={selectedAction}
    >
        <option value="" tabindex={0}>Select an action</option>
        <option value="buy">Buy Stock</option>
        <option value="sell">Sell Stock</option>
    </select>

    <div class="mt-3"></div>
    <InputNumber 
        id="amount-input"
        bind:value={selectedAmount}
        label="Amount"
        placeholder="Amount"
        minlength={0}
        showErrors={false}
    />

    {#if selectedAction && selectedStockId && selectedAmount}
        {#if selectedAction == "buy"}
            <p class="text-white">You need <span class="font-semibold">${centsToCurrency(stockValue(data.stocks, selectedStockId, selectedAmount))}</span> to perform this transaction</p>
            <p class="text-white">You will receive <span class="font-semibold">{selectedAmount}</span> share(s) from this transaction</p>
        {:else if selectedAction == "sell"}
            <p class="text-white">You need <span class="font-semibold">{selectedAmount}</span> share(s) to perform this transaction</p>
            <p class="text-white">You will receive <span class="font-semibold">${centsToCurrency(stockValue(data.stocks, selectedStockId, selectedAmount))}</span> from this transaction</p>
        {/if}

        <p><span class="font-semibold">Estimated Resultant Balance:</span> ${centsToCurrency(resultantBalance(data.stocks, selectedStockId, selectedAmount, selectedAction))}</p>

        {#if resultantBalance(data.stocks, selectedStockId, selectedAmount, selectedAction) < 0}
            <p class="text-red-500">You may not have enough money to perform this transaction</p>
        {/if}

        <div class="mt-2"></div>

        <ButtonReact 
            color={Color.Themable}
            onClick={createTransaction}
            icon="mdi:plus"
            text="Create Transaction"
            states={
                {
                    loading: "Please wait...",
                    success: "Transaction created successfully",
                    error: "Failed to create transaction"
                }
            }
        />
    {/if}
{:catch err}
    <ErrorComponent msg={err?.toString()} />
{/await}    