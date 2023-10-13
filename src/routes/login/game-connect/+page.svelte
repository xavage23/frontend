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
	import type { ApiError, User } from '$lib/generated';

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
			throw new Error("Couldn't find auth data in localStorage")
		}

		try {
			let json: AuthState = JSON.parse(authStateData);
			$authState = json;

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

		/*try {
			let res = await panelQuery({
				LoginActivateSession: {
					login_token: $panelAuthState?.loginToken || '',
					otp: inputtedCode
				}
			});

			if (!res.ok) {
				let err = await res.text();
				errorToast(err);
				return false;
			}

			localStorage.setItem(
				'panelStateData',
				JSON.stringify({
					...$panelAuthState,
					sessionState: 'active'
				})
			);

			goto(redirect());
			return true;
		} catch (e) {
			errorToast(e?.toString() || 'Unknown error');
			return false;
		}*/

		return true;
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
				loading: 'Activating session...',
				success: 'Successfully activated session!',
				error: 'Failed to verify OTP and/or log you in!'
			}}
			onClick={gameConnect}
		/>
	</article>
{:catch e}
	<ErrorComponent msg={e?.toString() || 'Unknown error'} />
{/await}
