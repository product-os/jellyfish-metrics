import has from 'lodash/has';
import isString from 'lodash/isString';

/**
 * @summary Convert milliseconds to seconds
 * @function
 *
 * @param ms - milliseconds
 * @returns seconds with fixed point notation of 4
 *
 * @example
 * ```typescript
 * const seconds = toSeconds(ms);
 * ```
 */
export function toSeconds(ms: number): number {
	return Number((ms / 1000).toFixed(4));
}

/**
 * @summary Parse type from a card or card partial
 * @function
 *
 * @param card - card or card partial object
 * @returns card type or unkown if unavailable
 */
export function parseType(card: any): string {
	const type =
		has(card, ['type']) && isString(card.type)
			? card.type.split('@')[0]
			: 'unknown';
	return type;
}
