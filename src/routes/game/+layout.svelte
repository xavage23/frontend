<script lang="ts">
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

	let perms: String[] = [];

	$: {
		quickActions = [];
		perms = [];

		quickActions.push({
			name: 'Index',
			description: 'Index Page',
			link: '/panel'
		});

		quickActions.push({
			name: 'Settings',
			description: 'Customize your experience!',
			link: '/panel/settings'
		});
	}
</script>

<AuthBoundary>
	<PaneWrapper>
		<InfoPane title="Navigation" description="Welcome to the panel">
			<div>
				{#each quickActions as action, index}
					<QuickMenuOption {index} {action} actionsLength={quickActions.length} />
				{/each}
			</div>

			<div class="mt-4" />

			<span class="font-semibold">Permissions:</span>
			<UnorderedList>
				{#each perms as perm}
					<ListItem>{perm}</ListItem>
				{/each}
			</UnorderedList>
		</InfoPane>

		<PaneContent>
			<div class="block mt-14">
				<slot />
			</div>
		</PaneContent>
	</PaneWrapper>
</AuthBoundary>
