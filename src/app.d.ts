// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		enum Direction {
			North = 0,
			East = 1,
			South = 2,
			West = 3,
		}

		type Position = {
			x: number;
			y: number;
		}

		type Hint = {
			x: number;
			y: number;
			dist: number;
			names: {
				de: string;
				en: string;
				es: string;
				fr: string;
				it: string;
				pt: string;
			}
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
