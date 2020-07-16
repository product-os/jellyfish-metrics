/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

/**
 * A module that gathers and exposes Prometheus metrics.
 *
 * @module metrics
 */

/**
 * @summary Convert milliseconds to seconds
 * @function
 *
 * @param {Number} ms - milliseconds
 * @returns {Number} seconds with fixed point notation of 4
 *
 * @example
 * const seconds = toSeconds(ms)
 */
exports.toSeconds = (ms) => {
	return Number((ms / 1000).toFixed(4))
}
