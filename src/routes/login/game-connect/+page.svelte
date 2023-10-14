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
	import type { ApiError, GameJoinRequest, GameJoinResponse, User } from '$lib/generated';

	let msg: string = 'Loading game selection screen...';

	let inputtedGameCode: string = '';

	const redirect = () => {
		let searchParams = new URLSearchParams(window.location.search);

		let redirect = searchParams.get('redirect');

		return redirect || '/game';
	};

	const loadGameConnect = async () => {
		let authStateData = localStorage.getItem('authState');
		
		logger.info("MFA", authStateData)

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
			logger.error('XavageBB', 'Failed to load auth data from localStorage');
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

		let res = await fetchClient(`${apiUrl}/users/${$authState?.userId}/join_game`, {
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
			description="Ask an on-site member if you don't have a game code yet."
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
	</article>
{:catch e}
	<ErrorComponent msg={e?.toString() || 'Unknown error'} />
{/await}
