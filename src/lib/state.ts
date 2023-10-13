import { writable, type Writable } from 'svelte/store';
import type { GameUser, User } from './generated';

export interface State {
	user: User,
    gameUser?: GameUser
}

export const state: Writable<State | null> = writable(null);
