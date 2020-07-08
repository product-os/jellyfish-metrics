/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

const ava = require('ava')
const metrics = require('./index')

const context = {
	id: 'TEST'
}

ava('.toSeconds() should convert milliseconds to seconds', (test) => {
	const seconds = metrics.toSeconds(3500)
	test.is(seconds, 3.5)
})

ava('.initExpress() creates an express app', (test) => {
	const app = metrics.initExpress(context)
	test.truthy(app)
})
