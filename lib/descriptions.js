/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

const {
	metrics
} = require('@balena/node-metrics-gatherer')
const utils = require('./utils')

/**
 * A module that gathers and exposes Prometheus metrics.
 *
 * @module metrics
 */

// Define histogram buckets
const latencyBuckets = metrics.client.exponentialBuckets(4, Math.SQRT2, 28).map((ms) => {
	return utils.toSeconds(ms)
})

const queryLatencyBuckets = metrics.client.exponentialBuckets(1, Math.SQRT2, 28).map((ms) => {
	return utils.toSeconds(ms)
})

// Metric names
exports.names = {
	CARD_UPSERT_TOTAL: 'jf_card_upsert_total',
	CARD_INSERT_TOTAL: 'jf_card_insert_total',
	CARD_READ_TOTAL: 'jf_card_read_total',
	MIRROR_TOTAL: 'jf_mirror_total',
	MIRROR_DURATION: 'jf_mirror_duration_seconds',
	MIRROR_FAILURE_TOTAL: 'jf_mirror_failure_total',
	WORKER_SATURATION: 'jf_worker_saturation',
	WORKER_JOB_DURATION: 'jf_worker_job_duration_seconds',
	WORKER_CONCURRENCY: 'jf_worker_concurrency',
	WORKER_ACTION_REQUEST_TOTAL: 'jf_worker_action_request_total',
	BACK_SYNC_CARD_TOTAL: 'jf_back_sync_total',
	TRANSLATE_TOTAL: 'jf_translate_total',
	TRANSLATE_DURATION: 'jf_translate_duration_seconds',
	TRANSLATE_FAILURE_TOTAL: 'jf_translate_failure_total',
	CARD_PATCH_TOTAL: 'jf_card_patch_total',
	CARD_PATCH_FAILURE_TOTAL: 'jf_card_patch_failure_total',
	CARD_PATCH_DURATION: 'jf_card_patch_duration_seconds',

	HTTP_QUERY_DURATION: 'jf_http_api_query_duration_seconds',
	HTTP_TYPE_DURATION: 'jf_http_api_type_duration_seconds',
	HTTP_ID_DURATION: 'jf_http_api_id_duration_seconds',
	HTTP_SLUG_DURATION: 'jf_http_api_slug_duration_seconds',
	HTTP_ACTION_DURATION: 'jf_http_api_action_duration_seconds',
	HTTP_WHOAMI_DURATION: 'jf_http_whoami_query_duration_seconds',

	HTTP_QUERY_TOTAL: 'jf_http_api_query_total',
	HTTP_TYPE_TOTAL: 'jf_http_api_type_total',
	HTTP_ID_TOTAL: 'jf_http_api_id_total',
	HTTP_SLUG_TOTAL: 'jf_http_api_slug_total',
	HTTP_ACTION_TOTAL: 'jf_http_api_action_total',
	HTTP_WHOAMI_TOTAL: 'jf_http_whoami_query_total',

	HTTP_QUERY_FAILURE_TOTAL: 'jf_http_api_query_failure_total',
	HTTP_TYPE_FAILURE_TOTAL: 'jf_http_api_type_failure_total',
	HTTP_ID_FAILURE_TOTAL: 'jf_http_api_id_failure_total',
	HTTP_SLUG_FAILURE_TOTAL: 'jf_http_api_slug_failure_total',
	HTTP_ACTION_FAILURE_TOTAL: 'jf_http_api_action_failure_total',
	HTTP_WHOAMI_FAILURE_TOTAL: 'jf_http_whoami_query_failure_total',

	SQL_GEN_DURATION: 'jf_sql_gen_duration_seconds',
	QUERY_DURATION: 'jf_query_duration_seconds',

	STREAMS_SATURATION: 'jf_streams_saturation',
	STREAMS_LINK_QUERY_TOTAL: 'jf_streams_link_query_total',
	STREAMS_ERROR_TOTAL: 'jf_streams_error_total'
}

// Define counters
const counters = [
	{
		name: exports.names.CARD_UPSERT_TOTAL,
		description: 'number of cards upserted'
	},
	{
		name: exports.names.CARD_INSERT_TOTAL,
		description: 'number of cards inserted'
	},
	{
		name: exports.names.CARD_READ_TOTAL,
		description: 'number of cards read from database/cache'
	},
	{
		name: exports.names.CARD_PATCH_TOTAL,
		description: 'number of card patch requests'
	},
	{
		name: exports.names.CARD_PATCH_FAILURE_TOTAL,
		description: 'number of card patch failures'
	},
	{
		name: exports.names.MIRROR_TOTAL,
		description: 'number of mirror calls'
	},
	{
		name: exports.names.MIRROR_FAILURE_TOTAL,
		description: 'number of mirror call failures'
	},
	{
		name: exports.names.WORKER_ACTION_REQUEST_TOTAL,
		description: 'number of received action requests'
	},
	{
		name: exports.names.TRANSLATE_TOTAL,
		description: 'number of translate calls'
	},
	{
		name: exports.names.TRANSLATE_FAILURE_TOTAL,
		description: 'number of translate call failures'
	},
	{
		name: exports.names.HTTP_QUERY_TOTAL,
		description: 'number of /query requests'
	},
	{
		name: exports.names.HTTP_TYPE_TOTAL,
		description: 'number of /type requests'
	},
	{
		name: exports.names.HTTP_ID_TOTAL,
		description: 'number of /id requests'
	},
	{
		name: exports.names.HTTP_SLUG_TOTAL,
		description: 'number of /slug requests'
	},
	{
		name: exports.names.HTTP_ACTION_TOTAL,
		description: 'number of /action requests'
	},
	{
		name: exports.names.HTTP_WHOAMI_TOTAL,
		description: 'number of /whoami requests'
	},
	{
		name: exports.names.HTTP_QUERY_FAILURE_TOTAL,
		description: 'number of /query request failures'
	},
	{
		name: exports.names.HTTP_TYPE_FAILURE_TOTAL,
		description: 'number of /type request failures'
	},
	{
		name: exports.names.HTTP_ID_FAILURE_TOTAL,
		description: 'number of /id request failures'
	},
	{
		name: exports.names.HTTP_SLUG_FAILURE_TOTAL,
		description: 'number of /slug request failures'
	},
	{
		name: exports.names.HTTP_ACTION_FAILURE_TOTAL,
		description: 'number of /action request failures'
	},
	{
		name: exports.names.HTTP_WHOAMI_FAILURE_TOTAL,
		description: 'number of /whoami request failures'
	},
	{
		name: exports.names.STREAMS_LINK_QUERY_TOTAL,
		description: 'number of times streams query links'
	},
	{
		name: exports.names.STREAMS_ERROR_TOTAL,
		description: 'number of stream errors'
	},
	{
		name: exports.names.BACK_SYNC_CARD_TOTAL,
		description: 'number of back syncs'
	}
]

// Define gauges
const gauges = [
	{
		name: exports.names.WORKER_SATURATION,
		description: 'number of jobs being processed in worker queues'
	},
	{
		name: exports.names.WORKER_CONCURRENCY,
		description: 'number of jobs worker queues can process concurrently'
	},
	{
		name: exports.names.STREAMS_SATURATION,
		description: 'number of streams open'
	}
]

// Define histograms
const histograms = [
	{
		name: exports.names.HTTP_QUERY_DURATION,
		description: 'histogram of durations taken to process /query requests in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.HTTP_TYPE_DURATION,
		description: 'histogram of durations taken to process /type requests in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.HTTP_ID_DURATION,
		description: 'histogram of durations taken to process /id requests in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.HTTP_SLUG_DURATION,
		description: 'histogram of durations taken to process /slug requests in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.HTTP_ACTION_DURATION,
		description: 'histogram of durations taken to process /action requests in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.HTTP_WHOAMI_DURATION,
		description: 'histogram of durations taken to process /whoami requests in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.MIRROR_DURATION,
		description: 'histogram of durations taken to make mirror calls in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.TRANSLATE_DURATION,
		description: 'histogram of durations taken to run translate calls in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.WORKER_JOB_DURATION,
		description: 'histogram of durations taken to complete worker jobs in seconds',
		buckets: latencyBuckets
	},
	{
		name: exports.names.SQL_GEN_DURATION,
		description: 'histogram of durations taken to generate sql with jsonschema2sql',
		buckets: queryLatencyBuckets
	},
	{
		name: exports.names.QUERY_DURATION,
		description: 'histogram of durations taken to query the database',
		buckets: queryLatencyBuckets
	},
	{
		name: exports.names.CARD_PATCH_DURATION,
		description: 'histogram of durations taken to patch cards in seconds',
		buckets: latencyBuckets
	}
]

/**
 * @summary Set descriptions for each metric
 * @function
 *
 * @example
 * describe()
 */
exports.describe = () => {
	counters.forEach((counter) => {
		if (!metrics.meta[counter.name]) {
			metrics.describe.counter(counter.name, counter.description)
		}
	})

	gauges.forEach((gauge) => {
		if (!metrics.meta[gauge.name]) {
			metrics.describe.gauge(gauge.name, gauge.description)
		}
	})

	histograms.forEach((histogram) => {
		if (!metrics.meta[histogram.name]) {
			metrics.describe.histogram(histogram.name, histogram.description, {
				buckets: histogram.buckets
			})
		}
	})
}
