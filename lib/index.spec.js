/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

require('dotenv').config()
const _ = require('lodash')
const ava = require('ava')
const environment = require('@balena/jellyfish-environment')
const http = require('http')
const metrics = require('./index')

ava.before(async (test) => {
	// Set up context
	test.context = {
		context: {
			id: 'WORKER-1.0.0-c8b4c3b1-bd1b-4ac7-a11d-a73703615b33'
		},
		integration: 'front',
		action: 'action-create-card',
		table: 'cards',
		milliseconds: 1000,
		card: {
			type: 'user@1.0.0'
		},
		cardType: 'user',
		change: {
			type: 'update',
			after: {
				type: 'user@1.0.0'
			}
		},
		func: _.noop,
		failFunc: () => {
			throw new Error('test')
		}
	}
	test.context.actor = metrics.actorFromContext(test.context.context)

	// Start metrics server
	metrics.startServer(test.context.context, environment.metrics.ports.app)

	// Trigger initial metrics data
	metrics.markCardInsert(test.context.card)
	metrics.markCardUpsert(test.context.card)
	metrics.markCardReadFromDatabase(test.context.card)
	metrics.markCardReadFromCache(test.context.card)
	metrics.markBackSync(test.context.integration)
	metrics.markActionRequest(test.context.action)
	metrics.markJobAdd(test.context.action, test.context.context.id)
	metrics.markJobDone(test.context.action, test.context.context.id, new Date().toISOString())
	metrics.markSqlGenTime(test.context.milliseconds)
	metrics.markQueryTime(test.context.milliseconds)
	metrics.markStreamOpened(test.context.context, test.context.table)
	metrics.markStreamLinkQuery(test.context.context, test.context.table, test.context.change)
	metrics.markStreamError(test.context.context, test.context.table)
	metrics.markQueueConcurrency()
	await metrics.measureMirror(test.context.integration, test.context.func)
	await metrics.measureTranslate(test.context.integration, test.context.func)
	await metrics.measureHttpQuery(test.context.func)
	await metrics.measureHttpType(test.context.func)
	await metrics.measureHttpId(test.context.func)
	await metrics.measureHttpSlug(test.context.func)
	await metrics.measureHttpAction(test.context.func)
	await metrics.measureHttpWhoami(test.context.func)

	// Failure counters
	await test.throwsAsync(metrics.measureMirror(test.context.integration, test.context.failFunc))
	await test.throwsAsync(metrics.measureTranslate(test.context.integration, test.context.failFunc))
	await test.throwsAsync(metrics.measureHttpQuery(test.context.failFunc))
	await test.throwsAsync(metrics.measureHttpType(test.context.failFunc))
	await test.throwsAsync(metrics.measureHttpId(test.context.failFunc))
	await test.throwsAsync(metrics.measureHttpSlug(test.context.failFunc))
	await test.throwsAsync(metrics.measureHttpAction(test.context.failFunc))
	await test.throwsAsync(metrics.measureHttpWhoami(test.context.failFunc))
})

const getMetrics = async () => {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'localhost',
			port: environment.metrics.ports.app,
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

ava('.actorFromContext() should return actor name', (test) => {
	const actor = metrics.actorFromContext(test.context.context)
	test.is(actor, 'worker')
})

ava('.initExpress() creates an express app', (test) => {
	const app = metrics.initExpress(test.context.context)
	test.truthy(app)
})

ava('.markCardInsert() should increment the card insert counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_insert_total{type="${test.context.cardType}"} 1`))

	metrics.markCardInsert(test.context.card)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_insert_total{type="${test.context.cardType}"} 2`))
})

ava('.markCardUpsert() should increment the card upsert counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_upsert_total{type="${test.context.cardType}"} 1`))

	metrics.markCardUpsert(test.context.card)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_upsert_total{type="${test.context.cardType}"} 2`))
})

ava('.markCardReadFromDatabase() should increment the card read from database counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_read_total{type="${test.context.cardType}",source="database"} 1`))

	metrics.markCardReadFromDatabase(test.context.card)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_read_total{type="${test.context.cardType}",source="database"} 2`))
})

ava('.markCardReadFromCache() should increment the card read from cache counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_read_total{type="${test.context.cardType}",source="cache"} 1`))

	metrics.markCardReadFromCache(test.context.card)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_card_read_total{type="${test.context.cardType}",source="cache"} 2`))
})

ava('.markBackSync() should increment the back sync counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_back_sync_total{type="${test.context.integration}"} 1`))

	metrics.markBackSync(test.context.integration)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_back_sync_total{type="${test.context.integration}"} 2`))
})

ava('.markActionRequest() should increment the action request counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_worker_action_request_total{type="${test.context.action}"} 1`))

	metrics.markActionRequest(test.context.action)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_worker_action_request_total{type="${test.context.action}"} 2`))
})

ava('.markJobAdd() and .markJobDone() should increment and decrement the worker saturation gauge', async (test) => {
	metrics.markJobAdd(test.context.action, test.context.context.id)
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_worker_saturation{type="${test.context.action}",worker="${test.context.context.id}"} 1`))

	metrics.markJobDone(test.context.action, test.context.context.id, new Date().toISOString())
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_worker_saturation{type="${test.context.action}",worker="${test.context.context.id}"} 0`))
})

ava('.markSqlGenTime() should update SQL query generation time metrics', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes('jf_sql_gen_duration_seconds_bucket{le="1.024"} 1'))
	test.truthy(result.body.includes('jf_sql_gen_duration_seconds_sum 1'))
	test.truthy(result.body.includes('jf_sql_gen_duration_seconds_count 1'))

	metrics.markSqlGenTime(test.context.milliseconds)
	result = await getMetrics()
	test.truthy(result.body.includes('jf_sql_gen_duration_seconds_bucket{le="1.024"} 2'))
	test.truthy(result.body.includes('jf_sql_gen_duration_seconds_sum 2'))
	test.truthy(result.body.includes('jf_sql_gen_duration_seconds_count 2'))
})

ava('.markQueryTime() should update SQL query execution time metrics', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes('jf_query_duration_seconds_bucket{le="1.024"} 1'))
	test.truthy(result.body.includes('jf_query_duration_seconds_sum 1'))
	test.truthy(result.body.includes('jf_query_duration_seconds_count 1'))

	metrics.markQueryTime(test.context.milliseconds)
	result = await getMetrics()
	test.truthy(result.body.includes('jf_query_duration_seconds_count 2'))
	test.truthy(result.body.includes('jf_query_duration_seconds_sum 2'))
	test.truthy(result.body.includes('jf_query_duration_seconds_count 2'))
})

ava('.markStreamOpened() and .markStreamClosed() should increment and decrement the stream saturation gauge', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_streams_saturation{actor="${test.context.actor}",table="${test.context.table}"} 1`))

	metrics.markStreamClosed(test.context.context, test.context.table)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_streams_saturation{actor="${test.context.actor}",table="${test.context.table}"} 0`))
})

ava('.markStreamLinkQuery() should increment the stream link query counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_streams_link_query_total{table="${test.context.table}",actor="${test.context.actor}",` +
	`type="${test.context.change.type}",card="${test.context.cardType}"} 1`))

	metrics.markStreamLinkQuery(test.context.context, test.context.table, test.context.change)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_streams_link_query_total{table="${test.context.table}",actor="${test.context.actor}",` +
	`type="${test.context.change.type}",card="${test.context.cardType}"} 2`))
})

ava('.markStreamError() should increment the stream error counter', async (test) => {
	let result = await getMetrics()
	test.truthy(result.body.includes(`jf_streams_error_total{actor="${test.context.actor}",table="${test.context.table}"} 1`))

	metrics.markStreamError(test.context.context, test.context.table)
	result = await getMetrics()
	test.truthy(result.body.includes(`jf_streams_error_total{actor="${test.context.actor}",table="${test.context.table}"} 2`))
})

ava('.markQueueConcurrency() should expose the queue concurrency setting', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes(`jf_worker_concurrency ${environment.queue.concurrency}`))
})

ava('.measureMirror() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(new RegExp(`jf_mirror_total{type="${test.context.integration}"} 2`).test(result.body))
	test.truthy(new RegExp(`jf_mirror_duration_seconds_count{type="${test.context.integration}"} 1`).test(result.body))
	test.truthy(new RegExp(`jf_mirror_failure_total{type="${test.context.integration}"} 1`).test(result.body))
})

ava('.measureTranslate() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(new RegExp(`jf_translate_total{type="${test.context.integration}"} 2`).test(result.body))
	test.truthy(new RegExp(`jf_translate_duration_seconds_count{type="${test.context.integration}"} 1`).test(result.body))
	test.truthy(new RegExp(`jf_translate_failure_total{type="${test.context.integration}"} 1`).test(result.body))
})

ava('.measureHttpQuery() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes('jf_http_api_query_total 2'))
	test.truthy(result.body.includes('jf_http_api_query_failure_total 1'))
	test.truthy(result.body.includes('jf_http_api_query_duration_seconds_count 1'))
})

ava('.measureHttpType() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes('jf_http_api_type_total 2'))
	test.truthy(result.body.includes('jf_http_api_type_failure_total 1'))
	test.truthy(result.body.includes('jf_http_api_type_duration_seconds_count 1'))
})

ava('.measureHttpId() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes('jf_http_api_id_total 2'))
	test.truthy(result.body.includes('jf_http_api_id_failure_total 1'))
	test.truthy(result.body.includes('jf_http_api_id_duration_seconds_count 1'))
})

ava('.measureHttpSlug() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes('jf_http_api_slug_total 2'))
	test.truthy(result.body.includes('jf_http_api_slug_failure_total 1'))
	test.truthy(result.body.includes('jf_http_api_slug_duration_seconds_count 1'))
})

ava('.measureHttpAction() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes('jf_http_api_action_total 2'))
	test.truthy(result.body.includes('jf_http_api_action_failure_total 1'))
	test.truthy(result.body.includes('jf_http_api_action_duration_seconds_count 1'))
})

ava('.measureHttpWhoami() should increment counters', async (test) => {
	const result = await getMetrics()
	test.truthy(result.body.includes('jf_http_whoami_query_total 2'))
	test.truthy(result.body.includes('jf_http_whoami_query_failure_total 1'))
	test.truthy(result.body.includes('jf_http_whoami_query_duration_seconds_count 1'))
})

ava('jf_card_insert_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_card_insert_total number of cards inserted'
	test.truthy(result.body.includes(desc))
})

ava('jf_card_upsert_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_card_upsert_total number of cards upserted'
	test.truthy(result.body.includes(desc))
})

ava('jf_card_read_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_card_read_total number of cards read from database/cache'
	test.truthy(result.body.includes(desc))
})

ava('jf_back_sync_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_back_sync_total number of back syncs'
	test.truthy(result.body.includes(desc))
})

ava('jf_worker_action_request_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_worker_action_request_total number of received action requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_worker_saturation has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_worker_saturation number of jobs being processed in worker queues'
	test.truthy(result.body.includes(desc))
})

ava('jf_sql_gen_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_sql_gen_duration_seconds histogram of durations taken to generate sql with jsonschema2sql'
	test.truthy(result.body.includes(desc))
})

ava('jf_query_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_query_duration_seconds histogram of durations taken to query the database'
	test.truthy(result.body.includes(desc))
})

ava('jf_streams_saturation has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_streams_saturation number of streams open'
	test.truthy(result.body.includes(desc))
})

ava('jf_streams_link_query_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_streams_link_query_total number of times streams query links'
	test.truthy(result.body.includes(desc))
})

ava('jf_streams_error_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_streams_error_total number of stream errors'
	test.truthy(result.body.includes(desc))
})

ava('jf_worker_concurrency has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_worker_concurrency number of jobs worker queues can process concurrently'
	test.truthy(result.body.includes(desc))
})

ava('jf_mirror_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_mirror_total number of mirror calls'
	test.truthy(result.body.includes(desc))
})

ava('jf_translate_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_translate_total number of translate calls'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_query_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_query_total number of /query requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_type_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_type_total number of /type requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_id_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_id_total number of /id requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_slug_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_slug_total number of /slug requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_action_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_action_total number of /action requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_whoami_query_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_whoami_query_total number of /whoami requests'
	test.truthy(result.body.includes(desc))
})

ava('jf_mirror_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_mirror_duration_seconds histogram of durations taken to make mirror calls in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_translate_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_translate_duration_seconds histogram of durations taken to run translate calls in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_query_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_query_duration_seconds histogram of durations taken to process /query requests in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_type_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_type_duration_seconds histogram of durations taken to process /type requests in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_id_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_id_duration_seconds histogram of durations taken to process /id requests in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_slug_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_slug_duration_seconds histogram of durations taken to process /slug requests in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_action_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_action_duration_seconds histogram of durations taken to process /action requests in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_whoami_query_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_whoami_query_duration_seconds histogram of durations ' +
		'taken to process /whoami requests in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_worker_job_duration_seconds has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_worker_job_duration_seconds histogram of durations taken to complete worker jobs in seconds'
	test.truthy(result.body.includes(desc))
})

ava('jf_mirror_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_mirror_failure_total number of mirror call failures'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_query_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_query_failure_total number of /query request failures'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_type_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_type_failure_total number of /type request failures'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_id_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_id_failure_total number of /id request failures'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_slug_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_slug_failure_total number of /slug request failures'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_api_action_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_api_action_failure_total number of /action request failures'
	test.truthy(result.body.includes(desc))
})

ava('jf_http_whoami_query_failure_total has a description', async (test) => {
	const result = await getMetrics()
	const desc = '# HELP jf_http_whoami_query_failure_total number of /whoami request failures'
	test.truthy(result.body.includes(desc))
})
