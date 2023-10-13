<script lang="ts">
	import { state } from '$lib/state';
	import AuthBoundary from '../../components/AuthBoundary.svelte';
	import ListItem from '../../components/ListItem.svelte';
	import UnorderedList from '../../components/UnorderedList.svelte';
	import InfoPane from '../../components/pane/InfoPane.svelte';
	import PaneContent from '../../components/pane/PaneContent.svelte';
	import PaneWrapper from '../../components/pane/PaneWrapper.svelte';
	import type { QuickAction } from './_core/QuickAction';
	import QuickMenuOption from './_core/QuickMenuOption.svelte';

	let quickActions: QuickAction[] = [
		{
			name: "Stocks",
			description: "Look at the stock tickers and their details",
			link: "/game",
		},
		{
			name: "Transactions",
			description: "Make a transaction on a stock!",
			link: "/game/transactions",
		},
		{
			name: "Portfolio",
			description: "View your portfolio",
			link: "/game/portfolio",
		},
		{
			name: "Transaction History",
			description: "View a history of all transactions!",
			link: "/game/transactions/history",
		},
		{
			name: "Game News",
			description: "View a history of all transactions!",
			link: "/game/news",
		},
		{
			name: "Leaderboard",
			description: "View the leaderboard",
			link: "/game/leaderboard",
		},
	];
</script>

<AuthBoundary>
	<PaneWrapper>
		<InfoPane title="Navigation" description="Welcome to the panel">
			<div>
				{#each quickActions as action, index}
					<QuickMenuOption {index} {action} actionsLength={quickActions.length} />
				{/each}
			</div>

			<div class="mt-4">
				<p class="font-semibold">Balance: ${Math.round(($state?.gameUser?.balance || 0) / 100)}</p>
				<p class="font-semibold">Initial Balance: ${Math.round(($state?.gameUser?.game?.initial_balance || 0) / 100)}</p>
				<p class="font-semibold">Net Profit/Loss: ${Math.round((($state?.gameUser?.balance || 0) - ($state?.gameUser?.game?.initial_balance || 0)) / 100)}</p>
				<div class="mb-5"></div>
				<small class="block"><span class="font-semibold">Current Prices:</span> {$state?.gameUser?.game?.current_price}</small>
				<small class="block"><span class="font-semibold">Game:</span> {$state?.gameUser?.game?.code} - {$state?.gameUser?.game?.description}</small>	
				<small class="block"><span class="font-semibold">Game Created On:</span> {new Date($state?.gameUser?.game?.created_at || 0)?.toLocaleString()}</small>
			</div>
		</InfoPane>

		<PaneContent>
			<div class="block mt-14">
				<slot />
			</div>
		</PaneContent>
	</PaneWrapper>
</AuthBoundary>
