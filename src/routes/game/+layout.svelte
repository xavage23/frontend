<script lang="ts">
	import { state } from '$lib/state';
	import { centsToCurrency } from '$lib/strings';
	import AuthBoundary from '../../components/AuthBoundary.svelte';
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
			enabled: () => true
		},
		{
			name: "Make Transaction",
			description: "Make a transaction on a stock!",
			link: "/game/transactions",
			enabled: () => $state?.gameUser?.game?.trading_enabled || false
		},
		{
			name: "Portfolio",
			description: "View your portfolio",
			link: "/game/portfolio",
			enabled: () => true
		},
		{
			name: "Transaction History",
			description: "View a history of all transactions!",
			link: "/game/transactions/history",
			enabled: () => true
		},
		{
			name: "Game News",
			description: "View a history of all transactions!",
			link: "/game/news",
			enabled: () => true
		},
		{
			name: "Leaderboard",
			description: "View the leaderboard",
			link: "/game/leaderboard",
			enabled: () => true
		},
	];
</script>

<AuthBoundary>
	<PaneWrapper>
		<InfoPane title="Navigation" description="">
			<div>
				{#each quickActions as action, index}
					{#if action.enabled()}
						<QuickMenuOption {index} {action} actionsLength={quickActions.length} />
					{/if}
				{/each}
			</div>

			<div class="mt-4">
				<p class="font-semibold">Username: {$state?.user?.username}</p>
				<p class="font-semibold">Current Balance: ${centsToCurrency($state?.gameUser?.current_balance || 0)}</p>
				<p class="font-semibold">Initial Balance: ${centsToCurrency($state?.gameUser?.initial_balance || 0)}</p>
				<p class="font-semibold">Net Profit/Loss: ${centsToCurrency(($state?.gameUser?.current_balance || 0) - ($state?.gameUser?.initial_balance || 0))}</p>
				{#if $state?.gameUser?.initial_balance != $state?.gameUser?.game?.initial_balance}
					<small class="block"><span class="font-semibold text-red-400">Applied Penalty/Extra:</span> ${centsToCurrency(($state?.gameUser?.game?.initial_balance || 0) - ($state?.gameUser?.initial_balance || 0))}</small>
				{/if}
				<div class="mb-5"></div>
				<small class="block"><span class="font-semibold">Current Price Snapshot:</span> {$state?.gameUser?.game?.current_price_index}</small>
				<small class="block"><span class="font-semibold">Game:</span> {$state?.gameUser?.game?.code} - {$state?.gameUser?.game?.name}</small>	
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
