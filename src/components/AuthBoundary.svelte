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
	import type { ApiError, User } from '$lib/generated';

	let loadingMsg = 'Waiting for monkeys?';
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

				if(!$authState?.gameId) {
					await goto(`/login/game-connect?redirect=${window.location.pathname}`);
					return false;
				}

				authorized = true;
			} catch (e) {
				logger.error('XavageBB', 'Failed to load auth state data from localStorage');

				if (!$page?.url?.pathname?.startsWith('/login')) {
					await goto(`/login?redirect=${window?.location?.pathname}`);
				}
				return false;
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

		$state = {
			user
		};

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
{/await}
