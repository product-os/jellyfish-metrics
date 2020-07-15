/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

const _ = require('lodash')
const environment = require('@balena/jellyfish-environment')
const express = require('express')
const http = require('http')
const logger = require('@balena/jellyfish-logger').getLogger(__filename)
const {
	metrics
} = require('@balena/node-metrics-gatherer')
const descriptions = require('./descriptions')
const utils = require('./utils')

/**
 * A module that gathers and exposes Prometheus metrics.
 *
 * @module metrics
 */

/**
 * @summary Measure duration of a promise execution and add to metrics
 * @function
 *
 * @param {String} name - metric name
 * @param {Object|Undefined} labels - metric labels
 * @param {Promise} fn - function to execute and measure
 * @returns {Any} promise execution result
 *
 * @example
 * const result = await measureAsync('my_metric', { ... }, myFunction, ...params)
 */
const measureAsync = async (name, labels, fn) => {
	const start = new Date()
	const result = await fn()
	const end = new Date()
	const duration = utils.toSeconds(end.getTime() - start.getTime())
	metrics.histogram(name, duration, labels)
	return result
}

/**
 * @summary Checks if an object looks to be a valid card or not.
 * @function
 *
 * @param {Object} card - object to validate
 * @returns {Boolean} validation result, true if card, false if not
 *
 * @example
 * const result = isCard(card)
 */
const isCard = (card) => {
	if (_.isPlainObject(card) && _.isString(card.type)) {
		return true
	}
	return false
}

/**
 * @summary Extract actor name from context ID
 * @function
 *
 * @param {Object} context - caller context
 * @returns {String} actor name
 *
 * @example
 * const actorName = exports.actorFromContext(context)
 */
exports.actorFromContext = (context) => {
	if (_.has(context, [ 'id' ]) && _.isString(context.id)) {
		return _.dropRight(context.id.split('-'), 6).join('-').toLowerCase()
	}
	return 'unknown'
}

/**
 * @summary Create express app using metrics and expose data on /metrics
 * @function
 *
 * @param {Object} context - execution context
 * @returns {Object} express app
 * @example
 * const application = metrics.initExpress(context)
 */
exports.initExpress = (context) => {
	return metrics.collectAPIMetrics(express())
}

/**
 * Expose gathered metrics on /metrics
 * Reassign port to random port number on collision
 *
 * @function
 *
 * @param {Object} context - execution context
 * @param {Number} port - port to expose metrics on
 *
 * @example
 * metrics.startServer(context, 9000)
 */
exports.startServer = (context, port) => {
	descriptions.describe()
	const b64enc = Buffer.from(`monitor:${environment.metrics.token}`).toString('base64')
	const isAuthorized = (req) => {
		return req.get('Authorization') === `Basic ${b64enc}`
	}
	logger.info(context, `Starting metrics server on ${port}`)
	const app = express()
	const server = http.Server(app)
	app.use('/metrics', metrics.requestHandler(isAuthorized))
	server.on('listening', () => {
		logger.info(context, `Metrics server listening on port ${server.address().port}`)
	})
	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			logger.info(context, `Port ${port} is in use, starting metrics server on a random port`)
			server.listen(0)
		}
	})
	server.listen(port)
}

/**
 * @summary Mark that a card was inserted
 * @function
 *
 * @param {Object} card - card that was inserted
 *
 * @example
 * metrics.markCardInsert(card)
 */
exports.markCardInsert = (card) => {
	if (!isCard(card)) {
		return
	}
	metrics.inc(descriptions.names.CARD_INSERT_TOTAL, 1, {
		type: card.type.split('@')[0]
	})
}

/**
 * @summary Mark that a card was upserted
 * @function
 *
 * @param {Object} card - card that was upserted
 *
 * @example
 * metrics.markCardUpsert(card)
 */
exports.markCardUpsert = (card) => {
	if (!isCard(card)) {
		return
	}
	metrics.inc(descriptions.names.CARD_UPSERT_TOTAL, 1, {
		type: card.type.split('@')[0]
	})
}

/**
 * @summary Mark that a card was read from the database
 * @function
 *
 * @param {Object} card - card that was read the database
 *
 * @example
 * metrics.markCardReadFromDatabase(card)
 */
exports.markCardReadFromDatabase = (card) => {
	if (!isCard(card)) {
		return
	}
	metrics.inc(descriptions.names.CARD_READ_TOTAL, 1, {
		type: card.type.split('@')[0],
		source: 'database'
	})
}

/**
 * @summary Mark that a card was read from cache
 * @function
 *
 * @param {Object} card - card that was read from cache
 *
 * @example
 * metrics.markCardReadFromCache(card)
 */
exports.markCardReadFromCache = (card) => {
	if (!isCard(card)) {
		return
	}
	metrics.inc(descriptions.names.CARD_READ_TOTAL, 1, {
		type: card.type.split('@')[0],
		source: 'cache'
	})
}

/**
 * @summary Mark that a card has been created due to back-sync
 * @function
 *
 * @param {String} integration - name of integration
 *
 * @example
 * metrics.markBackSync('front')
 */
exports.markBackSync = (integration) => {
	metrics.inc(descriptions.names.BACK_SYNC_CARD_TOTAL, 1, {
		type: integration
	})
}

/**
 * @summary Mark that an action request was received
 * @function
 *
 * @param {String} action - action name
 *
 * @example
 * metrics.markActionRequest('action-create-card')
 */
exports.markActionRequest = (action) => {
	metrics.inc(descriptions.names.WORKER_ACTION_REQUEST_TOTAL, 1, {
		type: action
	})
}

/**
 * @summary Expose current queue concurrency setting
 * @function
 *
 * @example
 * metrics.markQueueConcurrency()
 */
exports.markQueueConcurrency = () => {
	metrics.gauge(descriptions.names.WORKER_CONCURRENCY, environment.queue.concurrency)
}

/**
 * @summary Mark that a new job was added to the queue
 * @function
 *
 * @param {String} action - action name
 * @param {String} id - id of the worker
 *
 * @example
 * metrics.markJobAdd('action-create-card', context.id)
 */
exports.markJobAdd = (action, id) => {
	metrics.inc(descriptions.names.WORKER_SATURATION, 1, {
		type: action,
		worker: id
	})
}

/**
 * @summary Mark that a job in the queue has completed
 * @function
 *
 * @param {String} action - action name
 * @param {String} id - id of the worker
 * @param {String} timestamp - when action was completed
 *
 * @example
 * const action = 'action-create-card'
 * const timestamp = '2020-06-08T09:33:27.481Z'
 * metrics.markJobDone(action, context.id, timestamp)
 */
exports.markJobDone = (action, id, timestamp) => {
	const labels = {
		type: action,
		worker: id
	}
	const duration = utils.toSeconds(new Date().getTime() - new Date(timestamp).getTime())
	metrics.histogram(descriptions.names.WORKER_JOB_DURATION, duration, labels)
	metrics.dec(descriptions.names.WORKER_SATURATION, 1, labels)
}

/**
 * @summary Execute a mirror, marking duration and totals
 * @function
 *
 * @param {Object} integration - name of external integration
 * @param {Promise} fn - mirror function to execute
 * @returns {Any} mirror result
 *
 * @example
 * const result = await metrics.measureMirror('github', mirror())
 */
exports.measureMirror = async (integration, fn) => {
	const labels = {
		type: integration
	}
	metrics.inc(descriptions.names.MIRROR_TOTAL, 1, labels)
	const result = await measureAsync(descriptions.names.MIRROR_DURATION, labels, fn).catch((err) => {
		metrics.inc(descriptions.names.MIRROR_FAILURE_TOTAL, 1, labels)
		throw err
	})
	return result
}

/**
 * @summary Execute a translate, marking duration and totals
 * @function
 *
 * @param {Object} integration - name of external integration
 * @param {Promise} fn - mirror function to execute
 * @returns {Any} translate result
 *
 * @example
 * const result = await metrics.measureTranslate('github', translate())
 */
exports.measureTranslate = async (integration, fn) => {
	const labels = {
		type: integration
	}
	metrics.inc(descriptions.names.TRANSLATE_TOTAL, 1, labels)
	const results = await measureAsync(descriptions.names.TRANSLATE_DURATION, labels, fn)
	return results
}

/**
 * @summary Generates a generic measurement wrapper for an async function, that
 * tracks total calls, total failures and duration
 * @function
 *
 * @param {String} prefix - metric name prefix
 * @returns {Any} api result
 */
const getAsyncMeasureFn = (prefix) => {
	return async (fn) => {
		const total = `${prefix}_TOTAL`
		const duration = `${prefix}_DURATION`
		const failure = `${prefix}_FAILURE`
		metrics.inc(descriptions.names[total], 1)
		const result = await measureAsync(descriptions.names[duration], {}, fn).catch((err) => {
			metrics.inc(descriptions.names[failure], 1)
			throw err
		})
		return result
	}
}

/**
 * @summary Measure the duration of a request to the /query api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
exports.measureHttpQuery = getAsyncMeasureFn('HTTP_QUERY')

/**
 * @summary Measure the duration of a request to the /type api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
exports.measureHttpType = getAsyncMeasureFn('HTTP_TYPE')

/**
 * @summary Measure the duration of a request to the /id api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
exports.measureHttpId = getAsyncMeasureFn('HTTP_ID')

/**
 * @summary Measure the duration of a request to the /slug api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
exports.measureHttpSlug = getAsyncMeasureFn('HTTP_SLUG')

/**
 * @summary Measure the duration of a request to the /action api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
exports.measureHttpAction = getAsyncMeasureFn('HTTP_ACTION')

/**
 * @summary Measure the duration of a request to the /action api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
exports.measureHttpWhoami = getAsyncMeasureFn('HTTP_WHOAMI')

/**
 * @summary Mark how long it took to generate an SQL query from a JSON schema
 * @function
 *
 * @param {Number} ms - number of milliseconds it took to generate the query
 */
exports.markSqlGenTime = (ms) => {
	metrics.histogram(descriptions.names.SQL_GEN_DURATION, utils.toSeconds(ms))
}

/**
 * @summary Mark how long it took to execute an SQL query
 * @function
 *
 * @param {Number} ms - number of milliseconds it took to execute the query
 */
exports.markQueryTime = (ms) => {
	metrics.histogram(descriptions.names.QUERY_DURATION, utils.toSeconds(ms))
}

/**
 * @summary Mark that a new stream was opened
 * @function
 *
 * @param {Object} context - caller context
 * @param {String} table - table name
 *
 * @example
 * metrics.markStreamOpened(context, 'cards')
 */
exports.markStreamOpened = (context, table) => {
	metrics.inc(descriptions.names.STREAMS_SATURATION, 1, {
		actor: exports.actorFromContext(context),
		table
	})
}

/**
 * @summary Mark that a stream was closed
 * @function
 *
 * @param {Object} context - caller context
 * @param {String} table - table name
 *
 * @example
 * metrics.markStreamClosed(context, 'cards')
 */
exports.markStreamClosed = (context, table) => {
	metrics.dec(descriptions.names.STREAMS_SATURATION, 1, {
		actor: exports.actorFromContext(context),
		table
	})
}

/**
 * @summary Mark that a stream is querying links
 * @function
 *
 * @param {Object} context - caller context
 * @param {String} table - table name
 * @param {Object} change - change event object
 *
 * @example
 * metrics.markStreamLinkQuery(context, 'cards', change)
 */
exports.markStreamLinkQuery = (context, table, change) => {
	metrics.inc(descriptions.names.STREAMS_LINK_QUERY_TOTAL, 1, {
		table,
		actor: exports.actorFromContext(context),
		type: (_.has(change, [ 'type' ]) && _.isString(change.type)) ? change.type.toLowerCase() : 'unknown',
		card: (_.has(change, [ 'after', 'type' ]) && _.isString(change.after.type)) ? change.after.type.split('@')[0] : 'unknown'
	})
}

/**
 * @summary Mark that a stream error has occurred
 * @function
 *
 * @param {Object} context - caller context
 * @param {String} table - table name
 *
 * @example
 * metrics.markStreamError()
 */
exports.markStreamError = (context, table) => {
	metrics.inc(descriptions.names.STREAMS_ERROR_TOTAL, 1, {
		actor: exports.actorFromContext(context),
		table
	})
}
