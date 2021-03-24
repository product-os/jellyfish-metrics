/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import * as utils from './utils';

describe('toSeconds()', () => {
	test('should convert milliseconds to seconds', () => {
		const seconds = utils.toSeconds(3500);
		expect(seconds).toBe(3.5);
	});
});
