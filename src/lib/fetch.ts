import logger from './logger';
import { logoutUser } from './logout';

export const fetchClient = async (url: string, init?: RequestInit) => {
	logger.info('FetchClient', init?.method || 'GET', url);

	if(!init) {
		init = {};
	}

	if(!init?.headers) {
		init.headers = {
			"Content-Type": "application/json"
		};
	}

	const response = await fetch(url, init);

	if (response.status == 408) {
		throw new Error('Server down for maintenance');
	}

	return response;
};
