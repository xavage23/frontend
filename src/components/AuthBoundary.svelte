<script lang="ts">
	import logger from '$lib/logger';
	import { authState, type AuthState } from '$lib/authState';
	import { state } from '$lib/state';
	import { goto as gotoOnce } from '$app/navigation';
	import { page } from '$app/stores';
	import Loading from './Loading.svelte';
	import ErrorComponent from './Error.svelte';
	import { fetchClient } from '$lib/fetch';
	import { apiUrl } from '$lib/constants';
	import type { ApiError, GameUser, User } from '$lib/generated';
	import DangerButton from './inputs/multi/DangerButton.svelte';

	let loadingMsg = 'Waiting for monkeys?';
	let errorContext = '';
	let navigating: boolean = false;

	// Safari needs this patch here
	const goto = async (url: string) => {
		if(navigating) return new Promise(() => {});
		navigating = true;
		return await gotoOnce(url);
	}

	const setupState = async () => {
		if ($state) {
			return true;
		}

		logger.info('XavageBB', 'Page:', { $page });

		let authorized = false;

		logger.info('XavageBB', 'Loading page...');

		loadingMsg = 'Checking authentication';

		let authStateData = localStorage.getItem('authState');

		if (authStateData) {
			try {
				let json: AuthState = JSON.parse(authStateData);
				$authState = json;

				let authCheckRes = await fetchClient(`${apiUrl}/users/${$authState?.userId}/check_auth`, {
					method: "POST",
				})

				if (!authCheckRes.ok) {
					if([401, 403].includes(authCheckRes.status)) {
						let err: ApiError = await authCheckRes.json();
						errorContext = err?.message || 'Failed to check auth';
						throw new Error("Session expired. Please logout and login again");
					}
					
					let err: ApiError = await authCheckRes.json();
					throw new Error(err?.message || 'Failed to check auth');
				}


				if(!$authState?.gameId) {
					await goto(`/login/game-connect?redirect=${window.location.pathname}`);
					return false;
				}

				authorized = true;
			} catch (e) {
				logger.error('XavageBB', 'Failed to load auth state data from localStorage');
				throw e;
			}
		}

		if (!authorized) {
			if (!$page.url.pathname?.startsWith('/login')) {
				await goto(`/login?redirect=${window.location.pathname}`);
			}
			return false;
		}

		let userRes = await fetchClient(`${apiUrl}/users/${$authState?.userId}`, {
			headers: {
				Authorization: $authState?.token || '',
			}
		});

		if (!userRes.ok) {
			let err: ApiError = await userRes.json();
			throw new Error(`Failed to fetch user data: ${err}`);
		}

		let user: User = await userRes.json();

		if($authState?.gameId) {
			let gameUserRes = await fetchClient(`${apiUrl}/users/${$authState?.userId}/current_game_user`)

			if (!gameUserRes.ok) {
				let err: ApiError = await gameUserRes.json();
				throw new Error(`Failed to fetch game user: ${err}`);
			}

			let gameUser: GameUser = await gameUserRes.json();

			$state = {
				user,
				gameUser
			}
		} else {
			$state = {
				user
			};
		}

		setInterval(checkAuth, 1000 * 60 * 1);

		return true;
	};

	const checkAuth = async () => {
		logger.info('CheckAuth', 'dummy method called');

		try {
		} catch (err) {
			logger.error('CheckAuth', err);
		}
	};
</script>

{#await setupState()}
	<Loading msg={loadingMsg} />
{:then res}
	{#if res}
		<slot />
	{:else}
		<Loading msg={'Just a moment...'} />
	{/if}
{:catch err}
	<ErrorComponent msg={err?.toString()} />

	{#if errorContext}
		<p class="text-center text-red-500 text-xl font-semibold mt-4">
			{errorContext}
		</p>
	{/if}

	{#if $authState && $authState?.gameId}
	<div id="action-box" class="mt-3 rounded-md text-center">
		<button
			class="text-white hover:text-gray-300 focus:outline-none px-2 py-3 border font-semibold"
			on:click={() => {
				// Remove game id from authstate
				let newAuthState = {
					...$authState,
					gameId: undefined
				}

				localStorage.setItem('authState', JSON.stringify(newAuthState));
				window.location.reload()
			}}
		>
			Leave Game
		</button>
	</div>
	{/if}
{/await}
