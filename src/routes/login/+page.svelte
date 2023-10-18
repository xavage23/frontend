<script lang="ts">
	import InputText from '../../components/inputs/InputText.svelte';
	import ButtonReact from '../../components/button/ButtonReact.svelte';
	import { error } from '$lib/toast';
	import { authState, type AuthState } from '$lib/authState';
	import { goto as gotoOnce } from '$app/navigation';
	import { Color } from '../../components/button/colors';
	import { fetchClient } from '$lib/fetch';
	import { apiUrl } from '$lib/constants';
	import type { ApiError, UserLogin, UserLoginResponse } from '$lib/generated';
	import logger from '$lib/logger';
	import ErrorComponent from '../../components/Error.svelte';
	import Loading from '../../components/Loading.svelte';

	// Safari needs this patch here
	let navigating: boolean = false;
	const goto = async (url: string) => {
		if(navigating) return new Promise(() => {});
		navigating = true;
		return await gotoOnce(url);
	}

	const checkLogin = async () => {
		let authStateData = localStorage.getItem('authState');
		
		logger.info("Login", authStateData)

		if(authStateData) {
			try {
				let json: AuthState = JSON.parse(authStateData);
				$authState = json;

				let authCheckRes = await fetchClient(`${apiUrl}/users/${$authState?.userId}/check_auth`, {
					method: "POST"
				})

				if(authCheckRes.ok) {
					await goto('/');
					return true
				}
			} catch (err) {
				logger.error('XavageBB', 'Failed to load auth data from localStorage', err);
			}
		} else {
			logger.info("Login", "Not redirecting user")
		}
	}

	let username: string;
	let password: string;

	const login = async () => {
		if (!username || !password) {
			error('Please enter your username and password');
			return false;
		}

		let ul: UserLogin = {
			username,
			password
		};

		let res = await fetchClient(`${apiUrl}/users`, {
			method: "PUT",
			body: JSON.stringify(ul)
		});

		if (!res.ok) {
			let err: ApiError = await res.json();
			error(err?.message || 'Failed to login')
			return false;
		}

		let resp: UserLoginResponse = await res.json();

		let as: AuthState = {
			userId: resp.user_id,
			token: resp.token
		}

		localStorage.setItem('authState', JSON.stringify(as));

		await goto('/');
		return true
	};
</script>

{#await checkLogin()}
	<Loading msg="Please wait..." />
{:then data}
	{#if data}
		<p class="text-white text-xl">Redirecting you... please wait</p>
	{/if}
	<article class="p-4">
		<h1 class="text-3xl font-semibold">Login</h1>
		<p class="font-semibold text-lg">
			In order to login to the game, please input the 'Username' and 'Password' you were given.
		</p>

		<hr class="my-4" />

		<InputText
			bind:value={username}
			id="username"
			label="Username"
			placeholder="Enter your username"
			minlength={1}
			showErrors={false}
		/>

		<InputText
			bind:value={password}
			id="password"
			label="Password"
			placeholder="Enter your password"
			minlength={1}
			secret={true}
			showErrors={false}
		/>

		<ButtonReact
			color={Color.Themable}
			icon={'mdi:login'}
			text={'Login'}
			states={{
				loading: 'Please wait...',
				success: 'Moving you along...',
				error: 'Failed to login'
			}}
			onClick={login}
		/>
	</article>
{:catch err}
	<ErrorComponent msg={err?.toString()} />
{/await}
