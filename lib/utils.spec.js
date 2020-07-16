/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

const ava = require('ava')
const utils = require('./utils')

ava('.toSeconds() should convert milliseconds to seconds', (test) => {
	const seconds = utils.toSeconds(3500)
	test.is(seconds, 3.5)
})
