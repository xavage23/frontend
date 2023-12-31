<script lang="ts">
	import { apiUrl } from '$lib/constants';
	import { fetchClient } from '$lib/fetch';
	import type { ApiError, Leaderboard } from '$lib/generated';
    import { state } from '$lib/state';
	import Loading from '../../../components/Loading.svelte';
    import ErrorComponent from '../../../components/Error.svelte';
    import { DataHandler, Datatable, Th, ThFilter } from '@vincjo/datatables'
	import type { Readable } from 'svelte/store';
	import { centsToCurrency, title } from '$lib/strings';
	import logger from '$lib/logger';

    interface LeaderboardRow {
        userId: string;
        username: string;
        initialBalance: number;
        currentBalance: number;
        portfolioValue: number;
        portfolioTotalValue: number;
        gainsAfterSales: number;
        possibleFinalBalance: number;
    }

    let rows: Readable<LeaderboardRow[]>;

    const fetchTransactions = async () => {
        let res = await fetchClient(`${apiUrl}/users/${$state?.user?.id}/games/${$state?.gameUser?.game_id}/leaderboard`)

        if (!res.ok) {
            let err: ApiError = await res.json();
            throw new Error(`Failed to fetch transactions: ${err?.message}`);
        }

        let lbsMap: { [key: string]: Leaderboard } = await res.json();
        let lbs = Object.values(lbsMap);

        logger.info('XavageBB', lbs)

        let lbRows: LeaderboardRow[] = lbs
        .map(lb => {
            let gainsAfterSales = ((lb?.current_balance || 0) + (lb?.portfolio_value || 0)) - ($state?.gameUser?.initial_balance || 0)
            return {
                userId: lb?.user?.id || '',
                username: lb?.user?.username || '',
                initialBalance: lb?.initial_balance || 0,
                currentBalance: lb?.current_balance || 0,
                portfolioValue: lb?.portfolio_value || 0,
                portfolioTotalValue: (lb?.current_balance || 0) + (lb?.portfolio_value || 0),
                gainsAfterSales: gainsAfterSales,
                possibleFinalBalance: (lb?.current_balance || 0) + (lb?.portfolio_value || 0)
            }
        })

        const handler = new DataHandler(lbRows, { rowsPerPage: 10 })
        handler.sortDesc("possibleFinalBalance")
        rows = handler.getRows()

        return {
            lbs,
            lbRows,
            handler,
        }
    }
</script>

<svelte:head>
    <title>Leaderboard</title>
</svelte:head>

<h1 class="text-4xl font-semibold">Leaderboard</h1>

{#await fetchTransactions()}
    <Loading msg={"Loading"} disableHeader={true} />
{:then data}
    <Datatable handler={data.handler} search={false}>
        <table>
            <thead>
                <tr>
                    <Th handler={data.handler} orderBy="username">Username</Th>
                    <Th handler={data.handler} orderBy="initialBalance">Initial Balance</Th>
                    <Th handler={data.handler} orderBy="currentBalance">Current Balance</Th>
                    <Th handler={data.handler} orderBy="portfolioTotalValue">Portfolio Total Value</Th>
                    <Th handler={data.handler} orderBy="portfolioValue">Portfolio Value</Th>
                    <Th handler={data.handler} orderBy="gainsAfterSales">Gains After Sales</Th>
                    <Th handler={data.handler} orderBy="possibleFinalBalance">Possible Final Balance</Th>
                </tr>
                <tr>
                    <ThFilter handler={data.handler} filterBy="username"/>
                    <ThFilter handler={data.handler} filterBy="initialBalance"/>
                    <ThFilter handler={data.handler} filterBy="currentBalance"/>
                    <ThFilter handler={data.handler} filterBy="portfolioTotalValue"/>
                    <ThFilter handler={data.handler} filterBy="portfolioValue"/>
                    <ThFilter handler={data.handler} filterBy="gainsAfterSales"/>
                    <ThFilter handler={data.handler} filterBy="possibleFinalBalance"/>
                </tr>
            </thead>
            <tbody>
                {#each $rows as row}
                    <tr>
                        <td>{row.username}</td>
                        <td>${centsToCurrency(row.initialBalance)}</td>
                        <td>${centsToCurrency(row.currentBalance)}</td>
                        <td>${centsToCurrency(row.portfolioTotalValue)}</td>
                        <td>${centsToCurrency(row.portfolioValue)}</td>
                        <td>${centsToCurrency(row.gainsAfterSales)}</td>
                        <td>${centsToCurrency(row.possibleFinalBalance)}</td>
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