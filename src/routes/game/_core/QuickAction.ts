export interface Option {
	name: string;
	description: string;
	link: string;
}

export interface QuickAction {
	name: string;
	description: string;
	link: string;
	options?: Option[];
}
