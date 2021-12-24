import _ from 'lodash';

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
