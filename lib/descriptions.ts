/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { metrics } from '@balena/node-metrics-gatherer';
import { Histogram, MeasureMetricNames, Metric, MetricNames } from './types';
import * as utils from './utils';

/**
 * @summary Generate list of names for async measure metrics
 * @function
 *
 * @param prefix - metric name prefix
 * @returns set of metric names
 *
 * @example
 * ```typescript
 * const names = getMeasureMetricNames('jf_http_whoami');
 * ```
 */
export function getMeasureMetricNames(prefix: string): MeasureMetricNames {
	return {
		total: `${prefix}_total`,
		durationSeconds: `${prefix}_duration_seconds`,
		failureTotal: `${prefix}_failure_total`,
	};
}

/*
 * Latency buckets used with most histogram metrics
 */
const latencyBuckets = metrics.client
	.exponentialBuckets(4, Math.SQRT2, 28)
	.map((ms: number) => {
		return utils.toSeconds(ms);
	});

/*
 * Latency buckets used with SQL histogram metrics
 */
const queryLatencyBuckets = metrics.client
	.exponentialBuckets(1, Math.SQRT2, 28)
	.map((ms: number) => {
		return utils.toSeconds(ms);
	});

/*
 * List of names for all defined metrics
 */
export const Names: MetricNames = {
	card: {
		upsert: {
			total: 'jf_card_upsert_total',
		},
		insert: {
			total: 'jf_card_insert_total',
		},
		read: {
			total: 'jf_card_read_total',
		},
		patch: getMeasureMetricNames('jf_card_patch'),
	},
	worker: {
		total: 'jf_worker_action_request_total',
		saturation: 'jf_worker_saturation',
		jobDuration: 'jf_worker_job_duration_seconds',
		concurrency: 'jf_worker_concurrency',
	},
	backSync: {
		total: 'jf_back_sync_total',
	},
	sql: {
		gen: {
			durationSeconds: 'jf_sql_gen_duration_seconds',
		},
		query: {
			durationSeconds: 'jf_query_duration_seconds',
		},
	},
	streams: {
		total: 'jf_streams_link_query_total',
		saturation: 'jf_streams_saturation',
		errorTotal: 'jf_streams_error_total',
	},
	mirror: getMeasureMetricNames('jf_mirror'),
	translate: getMeasureMetricNames('jf_translate'),
	http: {
		query: getMeasureMetricNames('jf_http_api_query'),
		type: getMeasureMetricNames('jf_http_api_type'),
		id: getMeasureMetricNames('jf_http_api_id'),
		slug: getMeasureMetricNames('jf_http_api_slug'),
		action: getMeasureMetricNames('jf_http_api_action'),
		whoami: getMeasureMetricNames('jf_http_whoami_query'),
	},
};

/*
 * List of defined counter metrics
 */
const counters: Metric[] = [
	{
		name: Names.card.upsert.total,
		description: 'number of cards upserted',
	},
	{
		name: Names.card.insert.total,
		description: 'number of cards inserted',
	},
	{
		name: Names.card.read.total,
		description: 'number of cards read from database/cache',
	},
	{
		name: Names.card.patch.total,
		description: 'number of card patch requests',
	},
	{
		name: Names.card.patch.failureTotal,
		description: 'number of card patch failures',
	},
	{
		name: Names.mirror.total,
		description: 'number of mirror calls',
	},
	{
		name: Names.mirror.failureTotal,
		description: 'number of mirror call failures',
	},
	{
		name: Names.worker.total,
		description: 'number of received action requests',
	},
	{
		name: Names.translate.total,
		description: 'number of translate calls',
	},
	{
		name: Names.translate.failureTotal,
		description: 'number of translate call failures',
	},
	{
		name: Names.http.query.total,
		description: 'number of /query requests',
	},
	{
		name: Names.http.type.total,
		description: 'number of /type requests',
	},
	{
		name: Names.http.id.total,
		description: 'number of /id requests',
	},
	{
		name: Names.http.slug.total,
		description: 'number of /slug requests',
	},
	{
		name: Names.http.action.total,
		description: 'number of /action requests',
	},
	{
		name: Names.http.whoami.total,
		description: 'number of /whoami requests',
	},
	{
		name: Names.http.query.failureTotal,
		description: 'number of /query request failures',
	},
	{
		name: Names.http.type.failureTotal,
		description: 'number of /type request failures',
	},
	{
		name: Names.http.id.failureTotal,
		description: 'number of /id request failures',
	},
	{
		name: Names.http.slug.failureTotal,
		description: 'number of /slug request failures',
	},
	{
		name: Names.http.action.failureTotal,
		description: 'number of /action request failures',
	},
	{
		name: Names.http.whoami.failureTotal,
		description: 'number of /whoami request failures',
	},
	{
		name: Names.streams.total,
		description: 'number of times streams query links',
	},
	{
		name: Names.streams.errorTotal,
		description: 'number of stream errors',
	},
	{
		name: Names.backSync.total,
		description: 'number of back syncs',
	},
];

/**
 * List of defined gauge metrics
 */
const gauges: Metric[] = [
	{
		name: Names.worker.saturation,
		description: 'number of jobs being processed in worker queues',
	},
	{
		name: Names.worker.concurrency,
		description: 'number of jobs worker queues can process concurrently',
	},
	{
		name: Names.streams.saturation,
		description: 'number of streams open',
	},
];

/**
 * List of defined histogram metrics
 */
const histograms: Histogram[] = [
	{
		name: Names.http.query.durationSeconds,
		description:
			'histogram of durations taken to process /query requests in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.http.type.durationSeconds,
		description:
			'histogram of durations taken to process /type requests in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.http.id.durationSeconds,
		description:
			'histogram of durations taken to process /id requests in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.http.slug.durationSeconds,
		description:
			'histogram of durations taken to process /slug requests in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.http.action.durationSeconds,
		description:
			'histogram of durations taken to process /action requests in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.http.whoami.durationSeconds,
		description:
			'histogram of durations taken to process /whoami requests in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.mirror.durationSeconds,
		description: 'histogram of durations taken to make mirror calls in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.translate.durationSeconds,
		description:
			'histogram of durations taken to run translate calls in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.worker.jobDuration,
		description:
			'histogram of durations taken to complete worker jobs in seconds',
		buckets: latencyBuckets,
	},
	{
		name: Names.sql.gen.durationSeconds,
		description:
			'histogram of durations taken to generate sql with jsonschema2sql',
		buckets: queryLatencyBuckets,
	},
	{
		name: Names.sql.query.durationSeconds,
		description: 'histogram of durations taken to query the database',
		buckets: queryLatencyBuckets,
	},
	{
		name: Names.card.patch.durationSeconds,
		description: 'histogram of durations taken to patch cards in seconds',
		buckets: latencyBuckets,
	},
];

/**
 * @summary Set descriptions for each metric
 * @function
 *
 * @example
 * ```typescript
 * describe();
 * ```
 */
export function describe(): void {
	counters.forEach((counter) => {
		if (!metrics.meta[counter.name]) {
			metrics.describe.counter(counter.name, counter.description);
		}
	});

	gauges.forEach((gauge) => {
		if (!metrics.meta[gauge.name]) {
			metrics.describe.gauge(gauge.name, gauge.description);
		}
	});

	histograms.forEach((histogram) => {
		if (!metrics.meta[histogram.name]) {
			metrics.describe.histogram(histogram.name, histogram.description, {
				buckets: histogram.buckets,
			});
		}
	});
}
