/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

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
export function toSeconds (ms: number): number {
	return Number((ms / 1000).toFixed(4));
}
