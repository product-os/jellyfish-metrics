/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

require('dotenv').config()
const ava = require('ava')
const environment = require('@balena/jellyfish-environment')
const http = require('http')
const metrics = require('./index')

const context = {
	id: 'TEST'
}

const getMetrics = async (port) => {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'localhost',
			port,
			path: '/metrics',
			auth: `monitor:${environment.metrics.token}`
		}

		const req = http.get(options, (res) => {
			let data = ''

			res.on('data', (chunk) => {
				data += chunk
			})

			res.on('end', () => {
				return resolve({
					code: res.statusCode,
					body: data
				})
			})
		})

		req.on('error', (err) => {
			return reject(new Error(err))
		})

		req.end()
	})
}

ava('.toSeconds() should convert milliseconds to seconds', (test) => {
	const seconds = metrics.toSeconds(3500)
	test.is(seconds, 3.5)
})

ava('.initExpress() creates an express app', (test) => {
	const app = metrics.initExpress(context)
	test.truthy(app)
})

ava('.startServer() should export metrics data on /metrics', async (test) => {
	// Start server
	const port = 9500
	metrics.startServer(context, port)

	// Update a counter
	metrics.markCardUpsert({
		type: 'user@1.0.0'
	})

	// Get and check metrics data from endpoint
	const result = await getMetrics(port)
	test.is(result.code, 200)
	test.truthy(result.body.includes('jf_card_upsert_total'))
})
