<script lang="ts">
	import { goto } from '$app/navigation';
	import logger from '$lib/logger';
	import ErrorComponent from '../../../components/Error.svelte';
	import Loading from '../../../components/Loading.svelte';
	import InputText from '../../../components/inputs/InputText.svelte';
	import ButtonReact from '../../../components/button/ButtonReact.svelte';
	import { error as errorToast } from '$lib/toast';
	import { Color } from '../../../components/button/colors';
	import { authState, type AuthState } from '$lib/authState';
	import { fetchClient } from '$lib/fetch';
	import { apiUrl } from '$lib/constants';
	import type { ApiError, AvailableGame, GameJoinRequest, GameJoinResponse, User } from '$lib/generated';
	import BoolInput from '../../../components/inputs/BoolInput.svelte';

	let msg: string = 'Loading game selection screen...';

	let inputtedGameCode: string = '';
	let showAllAvailableGames: boolean = false;

	const redirect = () => {
		let searchParams = new URLSearchParams(window.location.search);

		let redirect = searchParams.get('redirect');

		return redirect || '/game';
	};

	const loadGameConnect = async () => {
		let authStateData = localStorage.getItem('authState');
		
		logger.info("GameConnect", authStateData)

		if (!authStateData) {
			await goto(`/login?redirect=${redirect()}`);
			return;
		}

		try {
			let json: AuthState = JSON.parse(authStateData);
			$authState = json;

			let authCheckRes = await fetchClient(`${apiUrl}/users/${$authState?.userId}/check_auth`, {
					method: "POST"
				})

			if (!authCheckRes.ok) {
				if([401, 403].includes(authCheckRes.status)) {
					throw new Error("Session expired. Please logout and login again");
				}
				
				let err: ApiError = await authCheckRes.json();
				throw new Error(err?.message || 'Failed to check auth');
			}

			if ($authState?.gameId) {
				await goto(redirect());
				return;
			}
		} catch (e) {
			logger.error('XavageBB', 'Failed to load auth data from localStorage', e);
			await goto(`/login?redirect=${redirect()}`);
			return;
		}

		let userRes = await fetchClient(`${apiUrl}/users/${$authState?.userId}`, {
			method: 'GET',
			headers: {
				Authorization: $authState?.token || ''
			}
		});

		if (!userRes.ok) {
			let err: ApiError = await userRes.json();
			throw new Error(err?.message || 'Failed to fetch user data');
		}

		let userData: User = await userRes.json();

		return {
			userData
		}
	};

	const gameConnect = async () => {
		if (!inputtedGameCode) {
			errorToast('Please enter a game code');
			return false;
		}

		let jr: GameJoinRequest = {
			game_code: inputtedGameCode,
		}

		let res = await fetchClient(`${apiUrl}/users/${$authState?.userId}/games`, {
			method: "POST",
			body: JSON.stringify(jr),
		})

		if (!res.ok) {
			let err: ApiError = await res.json();
			errorToast(err?.message || 'Failed to join game');
			return false;
		}

		let jresp: GameJoinResponse = await res.json();

		let as: AuthState = {
			token: $authState?.token || '',
			userId: $authState?.userId || '',
			gameId: jresp.id,
			newGame: jresp.new
		}

		localStorage.setItem('authState', JSON.stringify(as));

		goto("/game")
		return true
	};

	const fetchAvailableGames = async () => {
		let res = await fetchClient(`${apiUrl}/users/${$authState?.userId}/available_games`)

		if (!res.ok) {
			let err: ApiError = await res.json();
			throw new Error(`Failed to fetch available games: ${err?.message}`);
		}

		let ag: AvailableGame[] = await res.json();

		return {
			availableGames: ag
		};
	}
</script>

{#await loadGameConnect()}
	<Loading {msg} />
{:then data}
	<article class="p-4">
		<h1 class="text-3xl font-semibold">Welcome, {data?.userData?.username}!</h1>

		<InputText
			id="gamecode"
			minlength={0}
			label="Game Code"
			description="If you have been asked to use a specific game code, then enter it here"
			placeholder="Code"
			bind:value={inputtedGameCode}
			showErrors={false}
		/>

		<ButtonReact
			color={Color.Themable}
			icon={'mdi:key'}
			text={'Connect'}
			states={{
				loading: 'Activating game...',
				success: 'Successfully activated game!',
				error: 'Failed to fetch this game!'
			}}
			onClick={gameConnect}
		/>

		<div id="available-games-box" class="mt-10">
			{#await fetchAvailableGames()}
				<h2 id="avgame" aria-live="polite" class="text-2xl animate-pulse">Loading available game list...</h2>
			{:then data}
				<div>
					<h2 id="avgame" aria-live="polite" class="text-2xl mb-1">Available Games</h2>
					<p class="mb-2">Otherwise, choose the game you wish to play here</p>
				</div>
				<BoolInput 
					id="show-all-available-games"
					label="Show All Available Games"
					bind:value={showAllAvailableGames}
					disabled={false}
					description="Show all available games including games you may not be able to join"
				/>
				{#each data?.availableGames as avg}
					{#if showAllAvailableGames || (avg?.is_enabled && avg?.can_join)}
						<section class="rounded-md border mt-3 p-3 hover:bg-slate-800">
							<h3 class="text-xl">{avg?.game?.name}</h3>
							<ul>
								<li><span class="font-semibold">Code:</span> {avg?.game?.code}</li>
							</ul>
							<details>
								<summary class="hover:cursor-pointer">Details</summary>
								<ul class="list-disc list-inside">
									<li><span class="font-semibold">Created At:</span> {new Date(avg?.game?.created_at || 0).toLocaleString()}</li>
									<li><span class="font-semibold">Trading Enabled:</span> {avg?.game?.trading_enabled}</li>
									{#if avg?.game?.enabled}
										<li><span class="font-semibold">Enabled At/On:</span> {new Date(avg?.game?.enabled).toLocaleString()}</li>
									{:else}
										<li><span class="font-semibold">Enabled At/On:</span> Not enabled</li>
									{/if}
									<li><span class="font-semibold">Can Join:</span> {avg?.can_join}</li>
								</ul>
							</details>
							<div class="mt-2 mb-2"></div>
							{#if !avg?.is_enabled}
								<p class="text-red-500">This game is not enabled yet.</p>
							{:else if !avg?.can_join}
								<p class="text-red-500">You cannot join this game.</p>
							{:else}
								<ButtonReact
									color={Color.Themable}
									icon={'mdi:send'}
									text={`Join ${avg?.game?.name}`}
									states={{
										loading: 'Activating game...',
										success: 'Successfully activated game!',
										error: 'Failed to fetch this game!'
									}}
									onClick={() => {
										inputtedGameCode = avg?.game?.code || '';
										return gameConnect();
									}}
								/>
							{/if}
						</section>
					{/if}
				{/each}
			{:catch e}
				<ErrorComponent msg={e?.toString() || 'Unknown error'} />
			{/await}
		</div>
	</article>
{:catch e}
	<ErrorComponent msg={e?.toString() || 'Unknown error'} />
{/await}
