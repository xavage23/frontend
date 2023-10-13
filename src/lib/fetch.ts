import { get } from 'svelte/store';
import logger from './logger';
import { logoutUser } from './logout';
import { authState } from './authState';

export const fetchClient = async (url: string, init?: RequestInit) => {
	logger.info('FetchClient', init?.method || 'GET', url);

	if(!init) {
		init = {};
	}

	if(!init?.headers) {
		init.headers = {
			"Content-Type": "application/json",
			"Authorization": get(authState)?.token || "",
			"X-GameUser-ID": get(authState)?.gameId || "",
		};
	}

	const response = await fetch(url, init);

	if (response.status == 408) {
		throw new Error('Server down for maintenance');
	}

	return response;
};
