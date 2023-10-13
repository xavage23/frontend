import { writable, type Writable } from 'svelte/store';
import type { User } from './generated';

export interface State {
	user: User
}

export const state: Writable<State | null> = writable(null);
