import { getContext, setContext } from 'svelte';
import { invoke } from '@tauri-apps/api/core';

const contextKey = Symbol('HuntContextSvelte');

export class HuntContextSvelte {
	position = $state<App.Position>({ x: NaN, y: NaN });
	direction = $state<App.Direction>();
	hints = $state.raw<Record<number, App.Hint>>({});

	constructor() {
		$effect(() => {
			if (isNaN(this.position.x) || isNaN(this.position.y) || this.direction === undefined) {
				this.hints = [];
				return;
			}

			invoke('get_hints_for_direction', {
				x: this.position.x,
				y: this.position.y,
				direction: this.direction
			})
				.then((data) => {
					this.hints = data as Record<number, App.Hint>;
				})
				.catch((error) => {
					// todo: proper error handling
					console.error('Error fetching hints:', error);
					this.hints = [];
				});
		});
	}

	moveTo(id: number) {
		const data = this.hints[id];

		if (!data) {
			console.warn(`No hint found for id ${id}`);
			return;
		}
		this.position.x = data.x;
		this.position.y = data.y;
		this.direction = undefined;
	}
}

export const createHuntContext = () => {
	return setContext(contextKey, new HuntContextSvelte());
};

export const getHuntContext = () => {
	return getContext<HuntContextSvelte>(contextKey);
};
