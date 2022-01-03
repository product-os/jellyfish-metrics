import { defaultEnvironment } from '@balena/jellyfish-environment';
import { getLogger } from '@balena/jellyfish-logger';
import type { LogContext } from '@balena/jellyfish-logger';
import type { Contract } from '@balena/jellyfish-types/build/core';
import { metrics } from '@balena/node-metrics-gatherer';
import type { LabelSet } from '@balena/node-metrics-gatherer/out/types';
import express from 'express';
import { createServer, Server } from 'http';
import _ from 'lodash';
import { describe, Names } from './descriptions';
import type { MeasureMetricNames, StreamChange } from './types';
import * as utils from './utils';

export {
	Metric,
	Histogram,
	MeasureMetricNames,
	MetricName,
	ContractMetricNames,
	WorkerMetricNames,
	BackSyncMetricNames,
	SQLMetricNames,
	StreamMetricNames,
	MetricNames,
} from './types';

const logger = getLogger(__filename);

/**
 * A module that gathers and exposes Prometheus metrics.
 *
 * @module metrics
 */

/**
 * @summary Measure duration of a promise execution and add to metrics
 * @function
 *
 * @param name - metric name
 * @param labels - metric labels object or callback that returns labels object
 * @param fn - function to execute and measure
 * @returns promise execution result
 *
 * @example
 * ```typescript
 * const result = await measureAsync('my_metric', { ... }, myFunction, ...params)
 * ```
 */
async function measureAsync<TResult>(
	name: string,
	labels: LabelSet | ((result: TResult) => LabelSet),
	fn: () => Promise<TResult>,
): Promise<TResult> {
	const start = new Date();
	const result = await fn();
	const end = new Date();
	const duration = utils.toSeconds(end.getTime() - start.getTime());
	const histogramLabels: LabelSet = _.isFunction(labels)
		? labels(result)
		: labels;
	metrics.histogram(name, duration, histogramLabels);
	return result;
}

/**
 * @summary Extract actor name from logContext ID
 * @function
 *
 * @param logContext - log context
 * @returns actor name
 *
 * @example
 * ```typescript
 * const actorName = actorFromContext(logContext);
 * ```
 */
export function actorFromContext(logContext: LogContext): string {
	return logContext.id.split('-')[0];
}

/**
 * @summary Create express app using metrics and expose data on /metrics
 * @function
 *
 * @returns express app
 * @example
 * ```typescript
 * const application = metrics.initExpress();
 * ```
 */
export function initExpress(): express.Application {
	return metrics.collectAPIMetrics(express());
}

/**
 * Expose gathered metrics on /metrics
 * Reassign port to random port number on collision
 *
 * @function
 *
 * @param logContext - log context
 * @param port - port to expose metrics on
 *
 * @example
 * ```typescript
 * const server = startServer(context, 9000);
 * ```
 */
export function startServer(logContext: LogContext, port: number): Server {
	describe();
	const b64enc = Buffer.from(
		`monitor:${defaultEnvironment.metrics.token}`,
	).toString('base64');
	const isAuthorized = (req: express.Request) => {
		return req.get('Authorization') === `Basic ${b64enc}`;
	};
	logger.info(logContext, `Starting metrics server on ${port}`);
	const app = express();
	const server = createServer(app);
	app.use('/metrics', metrics.requestHandler(isAuthorized));
	server.on('listening', () => {
		logger.info(
			logContext,
			`Metrics server listening on port ${server.address()}`,
		);
	});
	server.on('error', (err: NodeJS.ErrnoException) => {
		if (err.code === 'EADDRINUSE') {
			logger.info(
				logContext,
				`Port ${port} is in use, starting metrics server on a random port`,
			);
			server.listen(0);
		}
	});
	server.listen(port);
	return server;
}

/**
 * @summary Mark that a contract was inserted
 * @function
 *
 * @param contract - contract that was inserted
 *
 * @example
 * ```typescript
 * markContractInsert(contract);
 * ```
 */
export function markContractInsert(contract: Contract): void {
	metrics.inc(Names.contract.insert.total, 1, {
		type: contract.type.split('@')[0],
	});
}

/**
 * @summary Mark that a contract was upserted
 * @function
 *
 * @param contract - contract that was upserted
 *
 * @example
 * ```typescript
 * markContractUpsert(contract);
 * ```
 */
export function markContractUpsert(contract: Contract): void {
	metrics.inc(Names.contract.upsert.total, 1, {
		type: contract.type.split('@')[0],
	});
}

/**
 * @summary Mark that a contract was read from the database
 * @function
 *
 * @param contract - contract that was read the database
 *
 * @example
 * ```typescript
 * markContractReadFromDatabase(contract);
 * ```
 */
export function markContractReadFromDatabase(
	contract: Partial<Contract>,
): void {
	const type = contract.type?.split('@')[0] || 'unknown';
	metrics.inc(Names.contract.read.total, 1, {
		type,
		source: 'database',
	});
}

/**
 * @summary Mark that a contract was read from cache
 * @function
 *
 * @param contract - contract that was read from cache
 *
 * @example
 * ```typescript
 * markContractReadFromCache(contract);
 * ```
 */
export function markContractReadFromCache(contract: Partial<Contract>): void {
	const type = contract.type?.split('@')[0] || 'unknown';
	metrics.inc(Names.contract.read.total, 1, {
		type,
		source: 'cache',
	});
}

/**
 * @summary Mark that a contract has been created due to back-sync
 * @function
 *
 * @param integration - name of integration
 *
 * @example
 * ```typescript
 * markBackSync('front');
 * ```
 */
export function markBackSync(integration: string): void {
	metrics.inc(Names.backSync.total, 1, {
		type: integration,
	});
}

/**
 * @summary Mark that an action request was received
 * @function
 *
 * @param action - action name
 *
 * @example
 * ```typescript
 * markActionRequest('action-create-card');
 * ```
 */
export function markActionRequest(action: string): void {
	metrics.inc(Names.worker.total, 1, {
		type: action,
	});
}

/**
 * @summary Expose current queue concurrency setting
 * @function
 *
 * @example
 * ```typescript
 * markQueueConcurrency();
 * ```
 */
export function markQueueConcurrency(): void {
	metrics.gauge(Names.worker.concurrency, defaultEnvironment.queue.concurrency);
}

/**
 * @summary Mark that a new job was added to the queue
 * @function
 *
 * @param action - action name
 * @param id - id of the worker
 *
 * @example
 * ```typescript
 * metrics.markJobAdd('action-create-card', context.id);
 * ```
 */
export function markJobAdd(action: string, id: string): void {
	metrics.inc(Names.worker.saturation, 1, {
		type: action,
		worker: id,
	});
}

/**
 * @summary Mark that a job in the queue has completed
 * @function
 *
 * @param action - action name
 * @param id - id of the worker
 * @param timestamp - when action was completed
 *
 * @example
 * ```typescript
 * const action = 'action-create-card';
 * const timestamp = '2020-06-08T09:33:27.481Z';
 * markJobDone(action, context.id, timestamp)
 * ```
 */
export function markJobDone(
	action: string,
	id: string,
	timestamp: string,
): void {
	const labels: LabelSet = {
		type: action,
		worker: id,
	};
	const duration = utils.toSeconds(
		new Date().getTime() - new Date(timestamp).getTime(),
	);
	metrics.histogram(Names.worker.jobDuration, duration, labels);
	metrics.dec(Names.worker.saturation, 1, labels);
}

/**
 * @summary Execute a mirror, marking duration and totals
 * @function
 *
 * @param integration - name of external integration
 * @param fn - mirror function to execute
 * @returns mirror result
 *
 * @example
 * ```typescript
 * const result = await metrics.measureMirror('github', mirror());
 * ```
 */
export async function measureMirror<TResult>(
	integration: string,
	fn: () => Promise<TResult>,
): Promise<TResult> {
	const labels: LabelSet = {
		type: integration,
	};
	metrics.inc(Names.mirror.total, 1, labels);
	const result = await measureAsync(
		Names.mirror.durationSeconds,
		labels,
		fn,
	).catch((err: Error) => {
		metrics.inc(Names.mirror.failureTotal, 1, labels);
		throw err;
	});
	return result;
}

/**
 * @summary Execute a translate, marking duration and totals
 * @function
 *
 * @param integration - name of external integration
 * @param fn - mirror function to execute
 * @returns translate result
 *
 * @example
 * const result = await metrics.measureTranslate('github', translate())
 */
export async function measureTranslate<TResult>(
	integration: string,
	fn: () => Promise<TResult>,
): Promise<TResult> {
	const labels: LabelSet = {
		type: integration,
	};
	metrics.inc(Names.translate.total, 1, labels);
	const results = await measureAsync(
		Names.translate.durationSeconds,
		labels,
		fn,
	).catch((err: Error) => {
		metrics.inc(Names.translate.failureTotal, 1, labels);
		throw err;
	});
	return results;
}

/**
 * @summary Generates a generic measurement wrapper for an async function, that
 * tracks total calls, total failures and duration
 * @function
 *
 * @param metric - metric being measured
 * @param labels - metric labels object or callback that returns labels object
 * @returns {Any} api result
 */
function getAsyncMeasureFn<TResult>(
	metric: MeasureMetricNames,
	labels?: LabelSet | ((result: any) => LabelSet),
): (fn: () => Promise<TResult>) => Promise<TResult> {
	const metricLabels = labels === undefined ? {} : labels;
	return async (fn: () => Promise<TResult>): Promise<TResult> => {
		metrics.inc(metric.total, 1);
		const result = await measureAsync(
			metric.durationSeconds,
			metricLabels,
			fn,
		).catch((err: Error) => {
			metrics.inc(metric.failureTotal, 1);
			throw err;
		});
		return result;
	};
}

/**
 * @summary Measure the duration of a request to the /query api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
export const measureHttpQuery = getAsyncMeasureFn(Names.http.query);

/**
 * @summary Measure the duration of a request to the /type api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
export const measureHttpType = getAsyncMeasureFn(Names.http.type);

/**
 * @summary Measure the duration of a request to the /id api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
export const measureHttpId = getAsyncMeasureFn(Names.http.id);

/**
 * @summary Measure the duration of a request to the /slug api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
export const measureHttpSlug = getAsyncMeasureFn(Names.http.slug);

/**
 * @summary Measure the duration of a request to the /action api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
export const measureHttpAction = getAsyncMeasureFn(Names.http.action);

/**
 * @summary Measure the duration of a request to the /action api endpoint
 * @function
 *
 * @param {Promise} fn - api function to execute
 * @returns {Any} api result
 */
export const measureHttpWhoami = getAsyncMeasureFn(Names.http.whoami);

/**
 * @summary Mark how long it took to generate an SQL query from a JSON schema
 * @function
 *
 * @param {Number} ms - number of milliseconds it took to generate the query
 */
export function markSqlGenTime(ms: number): void {
	metrics.histogram(Names.sql.gen.durationSeconds, utils.toSeconds(ms));
}

/**
 * @summary Mark how long it took to execute an SQL query
 * @function
 *
 * @param ms - number of milliseconds it took to execute the query
 */
export function markQueryTime(ms: number): void {
	metrics.histogram(Names.sql.query.durationSeconds, utils.toSeconds(ms));
}

/**
 * @summary Mark that a new stream was opened
 * @function
 *
 * @param logContext - log context
 * @param table - table name
 *
 * @example
 * ```typescript
 * markStreamOpened(logContext, 'cards');
 * ```
 */
export function markStreamOpened(logContext: LogContext, table: string): void {
	metrics.inc(Names.streams.saturation, 1, {
		actor: exports.actorFromContext(logContext),
		table,
	});
}

/**
 * @summary Mark that a stream was closed
 * @function
 *
 * @param logContext - log context
 * @param table - table name
 *
 * @example
 * ```typescript
 * markStreamClosed(logContext, 'cards');
 * ```
 */
export function markStreamClosed(logContext: LogContext, table: string): void {
	metrics.dec(Names.streams.saturation, 1, {
		actor: exports.actorFromContext(logContext),
		table,
	});
}

/**
 * @summary Mark that a stream is querying links
 * @function
 *
 * @param logContext - log context
 * @param table - table name
 * @param change - change event object
 *
 * @example
 * ```typescript
 * markStreamLinkQuery(logContext, 'cards', change);
 * ```
 */
export function markStreamLinkQuery(
	logContext: LogContext,
	table: string,
	change: StreamChange,
): void {
	metrics.inc(Names.streams.total, 1, {
		table,
		actor: exports.actorFromContext(logContext),
		type:
			_.has(change, ['type']) && _.isString(change.type)
				? change.type.toLowerCase()
				: 'unknown',
		card: _.has(change, ['after'])
			? change.after.type.split('@')[0]
			: 'unknown',
	});
}

/**
 * @summary Mark that a stream error has occurred
 * @function
 *
 * @param logContext - log context
 * @param table - table name
 *
 * @example
 * ```typescript
 * metrics.markStreamError(logContext, 'cards');
 * ```
 */
export function markStreamError(logContext: LogContext, table: string): void {
	metrics.inc(Names.streams.errorTotal, 1, {
		actor: exports.actorFromContext(logContext),
		table,
	});
}

/**
 * @summary Execute a contract patch, marking duration and totals
 * @function
 *
 * @param fn - contract patch function to execute
 * @returns contract patch result
 *
 * @example
 * ```typescript
 * const result = await measureContractPatch(fn);
 * ```
 */
export async function measureContractPatch(
	fn: () => Promise<any>,
): Promise<any> {
	const result = await getAsyncMeasureFn(
		Names.contract.patch,
		(contract: Contract) => {
			return {
				type: contract.type.split('@')[0],
			};
		},
	)(fn);
	return result;
}
