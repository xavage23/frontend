import { writable, type Writable } from 'svelte/store';

export interface AuthState {
	token: string;
	userId: string;
	gameId?: string;
	newGame?: boolean;
}

export const authState: Writable<AuthState | null> = writable(null);
