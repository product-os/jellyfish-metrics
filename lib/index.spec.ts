/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { defaultEnvironment } from '@balena/jellyfish-environment';
import { Contract } from '@balena/jellyfish-types/build/core';
import { random } from '@balena/jellyfish-uuid';
import { get, IncomingMessage } from 'http';
import clone from 'lodash/clone';
import noop from 'lodash/noop';
import {
	actorFromContext,
	initExpress,
	markActionRequest,
	markBackSync,
	markCardInsert,
	markCardReadFromCache,
	markCardReadFromDatabase,
	markCardUpsert,
	markJobAdd,
	markJobDone,
	markQueryTime,
	markQueueConcurrency,
	markSqlGenTime,
	markStreamClosed,
	markStreamError,
	markStreamLinkQuery,
	markStreamOpened,
	measureCardPatch,
	measureHttpAction,
	measureHttpId,
	measureHttpQuery,
	measureHttpSlug,
	measureHttpType,
	measureHttpWhoami,
	measureMirror,
	measureTranslate,
	startServer,
} from './index';
import { StreamChange } from './types';

// TODO: Add jsdoc and define local type for testContext instead of "any".
let testContext: any = {};
beforeAll(async () => {
	// Prepare fake cards/data for tests.
	const beforeCard: Contract = {
		id: await random(),
		version: '1.0.0',
		slug: `card-${await random()}`,
		type: 'card@1.0.0',
		tags: [],
		markers: [],
		created_at: new Date().toISOString(),
		updated_at: '',
		active: true,
		data: {
			foo: 'bar',
		},
		requires: [{}],
		capabilities: [{}],
	};
	const afterCard = clone(beforeCard);
	afterCard.updated_at = new Date().toISOString();
	afterCard.data.foo = 'buz';
	const change: StreamChange = {
		type: 'update',
		before: beforeCard,
		after: afterCard,
	};

	// Set up test context.
	const context = {
		id: `WORKER-1.0.0-${await random()}`,
	};
	testContext = {
		context,
		integration: 'front',
		action: 'action-create-card',
		table: 'cards',
		milliseconds: 1000,
		card: beforeCard,
		cardType: 'card',
		change,
		func: noop,
		failFunc: () => {
			throw new Error('test');
		},
		actor: actorFromContext(context),
		cardPatchFunc: async () => {
			return beforeCard;
		},
		server: startServer(context, defaultEnvironment.metrics.ports.app),
	};

	// Trigger initial metrics data
	markCardInsert(testContext.card);
	markCardUpsert(testContext.card);
	markCardReadFromDatabase(testContext.card);
	markCardReadFromCache(testContext.card);
	markBackSync(testContext.integration);
	markActionRequest(testContext.action);
	markJobAdd(testContext.action, testContext.context.id);
	markJobDone(
		testContext.action,
		testContext.context.id,
		new Date().toISOString(),
	);
	markSqlGenTime(testContext.milliseconds);
	markQueryTime(testContext.milliseconds);
	markStreamOpened(testContext.context, testContext.table);
	markStreamLinkQuery(
		testContext.context,
		testContext.table,
		testContext.change,
	);
	markStreamError(testContext.context, testContext.table);
	markQueueConcurrency();
	await measureMirror(testContext.integration, testContext.func);
	await measureTranslate(testContext.integration, testContext.func);
	await measureHttpQuery(testContext.func);
	await measureHttpType(testContext.func);
	await measureHttpId(testContext.func);
	await measureHttpSlug(testContext.func);
	await measureHttpAction(testContext.func);
	await measureHttpWhoami(testContext.func);
	await measureCardPatch(testContext.cardPatchFunc);
});

/**
 * Clean up post test run, close metrics http server
 */
afterAll(() => {
	testContext.server.close();
});

/**
 * Get raw metrics data from local /metrics endpoint.
 * This is the data that Prometheus gets during scraping.
 *
 * @returns HTTP response code and body
 *
 * @example
 * ```typescript
 * const metricsData = await getMetrics();
 * ```
 */
async function getMetrics(): Promise<{
	code: number | undefined;
	body: string;
}> {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'localhost',
			port: defaultEnvironment.metrics.ports.app,
			path: '/metrics',
			auth: `monitor:${defaultEnvironment.metrics.token}`,
		};

		const req = get(options, (res: IncomingMessage) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				return resolve({
					code: res.statusCode,
					body: data,
				});
			});
		});

		req.on('error', (err: Error) => {
			return reject(new Error(`${err}`));
		});

		req.end();
	});
}

test('actorFromContext() should return actor name', () => {
	const actor = actorFromContext(testContext.context);
	expect(actor).toBe('worker');
});

test('initExpress() should create an express app', () => {
	const app = initExpress();
	expect(app).toBeTruthy();
});

test('initExpress() should create an express app', () => {
	const app = initExpress();
	expect(app).toBeTruthy();
});

test('.markCardInsert() should increment the card insert counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_insert_total{type="${testContext.cardType}"} 1`,
		),
	).toBeTruthy();

	markCardInsert(testContext.card);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_insert_total{type="${testContext.cardType}"} 2`,
		),
	).toBeTruthy();
});

test('.markCardUpsert() should increment the card upsert counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_upsert_total{type="${testContext.cardType}"} 1`,
		),
	).toBeTruthy();

	markCardUpsert(testContext.card);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_upsert_total{type="${testContext.cardType}"} 2`,
		),
	).toBeTruthy();
});

test('.markCardReadFromDatabase() should increment the card read from database counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_read_total{type="${testContext.cardType}",source="database"} 1`,
		),
	).toBeTruthy();

	markCardReadFromDatabase(testContext.card);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_read_total{type="${testContext.cardType}",source="database"} 2`,
		),
	).toBeTruthy();
});

test('.markCardReadFromCache() should increment the card read from cache counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_read_total{type="${testContext.cardType}",source="cache"} 1`,
		),
	).toBeTruthy();

	markCardReadFromCache(testContext.card);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_card_read_total{type="${testContext.cardType}",source="cache"} 2`,
		),
	).toBeTruthy();
});

test('.markBackSync() should increment the back sync counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_back_sync_total{type="${testContext.integration}"} 1`,
		),
	).toBeTruthy();

	markBackSync(testContext.integration);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_back_sync_total{type="${testContext.integration}"} 2`,
		),
	).toBeTruthy();
});

test('.markActionRequest() should increment the action request counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_worker_action_request_total{type="${testContext.action}"} 1`,
		),
	).toBeTruthy();

	markActionRequest(testContext.action);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_worker_action_request_total{type="${testContext.action}"} 2`,
		),
	).toBeTruthy();
});

test('.markJobAdd() and .markJobDone() should increment and decrement the worker saturation gauge', async () => {
	markJobAdd(testContext.action, testContext.context.id);
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_worker_saturation{type="${testContext.action}",worker="${testContext.context.id}"} 1`,
		),
	).toBeTruthy();

	markJobDone(
		testContext.action,
		testContext.context.id,
		new Date().toISOString(),
	);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_worker_saturation{type="${testContext.action}",worker="${testContext.context.id}"} 0`,
		),
	).toBeTruthy();
});

test('.markSqlGenTime() should update SQL query generation time metrics', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes('jf_sql_gen_duration_seconds_bucket{le="1.024"} 1'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_sql_gen_duration_seconds_sum 1'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_sql_gen_duration_seconds_count 1'),
	).toBeTruthy();

	markSqlGenTime(testContext.milliseconds);
	result = await getMetrics();
	expect(
		result.body.includes('jf_sql_gen_duration_seconds_bucket{le="1.024"} 2'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_sql_gen_duration_seconds_sum 2'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_sql_gen_duration_seconds_count 2'),
	).toBeTruthy();
});

test('.markQueryTime() should update SQL query execution time metrics', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes('jf_query_duration_seconds_bucket{le="1.024"} 1'),
	).toBeTruthy();
	expect(result.body.includes('jf_query_duration_seconds_sum 1')).toBeTruthy();
	expect(
		result.body.includes('jf_query_duration_seconds_count 1'),
	).toBeTruthy();

	markQueryTime(testContext.milliseconds);
	result = await getMetrics();
	expect(
		result.body.includes('jf_query_duration_seconds_count 2'),
	).toBeTruthy();
	expect(result.body.includes('jf_query_duration_seconds_sum 2')).toBeTruthy();
	expect(
		result.body.includes('jf_query_duration_seconds_count 2'),
	).toBeTruthy();
});

test('.markStreamOpened() and .markStreamClosed() should increment and decrement the stream saturation gauge', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_streams_saturation{actor="${testContext.actor}",table="${testContext.table}"} 1`,
		),
	).toBeTruthy();

	markStreamClosed(testContext.context, testContext.table);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_streams_saturation{actor="${testContext.actor}",table="${testContext.table}"} 0`,
		),
	).toBeTruthy();
});

test('.markStreamLinkQuery() should increment the stream link query counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_streams_link_query_total{table="${testContext.table}",actor="${testContext.actor}",` +
				`type="${testContext.change.type}",card="${testContext.cardType}"} 1`,
		),
	).toBeTruthy();

	markStreamLinkQuery(
		testContext.context,
		testContext.table,
		testContext.change,
	);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_streams_link_query_total{table="${testContext.table}",actor="${testContext.actor}",` +
				`type="${testContext.change.type}",card="${testContext.cardType}"} 2`,
		),
	).toBeTruthy();
});

test('.markStreamError() should increment the stream error counter', async () => {
	let result = await getMetrics();
	expect(
		result.body.includes(
			`jf_streams_error_total{actor="${testContext.actor}",table="${testContext.table}"} 1`,
		),
	).toBeTruthy();

	markStreamError(testContext.context, testContext.table);
	result = await getMetrics();
	expect(
		result.body.includes(
			`jf_streams_error_total{actor="${testContext.actor}",table="${testContext.table}"} 2`,
		),
	).toBeTruthy();
});

test('.markQueueConcurrency() should expose the queue concurrency setting', async () => {
	const result = await getMetrics();
	expect(
		result.body.includes(
			`jf_worker_concurrency ${defaultEnvironment.queue.concurrency}`,
		),
	).toBeTruthy();
});

test('.measureMirror() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureMirror(testContext.integration, testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(
		new RegExp(`jf_mirror_total{type="${testContext.integration}"} 2`).test(
			result.body,
		),
	).toBeTruthy();
	expect(
		new RegExp(
			`jf_mirror_duration_seconds_count{type="${testContext.integration}"} 1`,
		).test(result.body),
	).toBeTruthy();
	expect(
		new RegExp(
			`jf_mirror_failure_total{type="${testContext.integration}"} 1`,
		).test(result.body),
	).toBeTruthy();
});

test('.measureTranslate() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureTranslate(testContext.integration, testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(
		new RegExp(`jf_translate_total{type="${testContext.integration}"} 2`).test(
			result.body,
		),
	).toBeTruthy();
	expect(
		new RegExp(
			`jf_translate_duration_seconds_count{type="${testContext.integration}"} 1`,
		).test(result.body),
	).toBeTruthy();
	expect(
		new RegExp(
			`jf_translate_failure_total{type="${testContext.integration}"} 1`,
		).test(result.body),
	).toBeTruthy();
});

test('.measureHttpQuery() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureHttpQuery(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_query_total 2')).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_query_failure_total 1'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_query_duration_seconds_count 1'),
	).toBeTruthy();
});

test('.measureHttpType() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureHttpType(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_type_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_type_failure_total 1')).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_type_duration_seconds_count 1'),
	).toBeTruthy();
});

test('.measureHttpId() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureHttpId(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_id_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_id_failure_total 1')).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_id_duration_seconds_count 1'),
	).toBeTruthy();
});

test('.measureHttpSlug() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureHttpSlug(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_slug_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_slug_failure_total 1')).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_slug_duration_seconds_count 1'),
	).toBeTruthy();
});

test('.measureHttpAction() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureHttpAction(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_action_total 2')).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_action_failure_total 1'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_http_api_action_duration_seconds_count 1'),
	).toBeTruthy();
});

test('.measureHttpWhoami() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureHttpWhoami(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_http_whoami_query_total 2')).toBeTruthy();
	expect(
		result.body.includes('jf_http_whoami_query_failure_total 1'),
	).toBeTruthy();
	expect(
		result.body.includes('jf_http_whoami_query_duration_seconds_count 1'),
	).toBeTruthy();
});

test('.measureCardPatch() should increment counters', async () => {
	expect.assertions(4);
	try {
		await measureCardPatch(testContext.failFunc);
	} catch (error) {
		expect(error).toEqual(new Error('test'));
	}

	const result = await getMetrics();
	expect(result.body.includes('jf_card_patch_total 2')).toBeTruthy();
	expect(result.body.includes('jf_card_patch_failure_total 1')).toBeTruthy();
	expect(
		result.body.includes(
			`jf_card_patch_duration_seconds_count{type="${testContext.cardType}"} 1`,
		),
	).toBeTruthy();
});

test('jf_card_insert_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_card_insert_total number of cards inserted';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_card_upsert_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_card_upsert_total number of cards upserted';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_card_patch_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_card_patch_total number of card patch requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_card_patch_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_card_patch_failure_total number of card patch failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_card_read_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_card_read_total number of cards read from database/cache';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_back_sync_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_back_sync_total number of back syncs';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_action_request_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_worker_action_request_total number of received action requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_saturation has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_worker_saturation number of jobs being processed in worker queues';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_sql_gen_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_sql_gen_duration_seconds histogram of durations taken to generate sql with jsonschema2sql';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_query_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_query_duration_seconds histogram of durations taken to query the database';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_streams_saturation has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_streams_saturation number of streams open';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_streams_link_query_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_streams_link_query_total number of times streams query links';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_streams_error_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_streams_error_total number of stream errors';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_concurrency has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_worker_concurrency number of jobs worker queues can process concurrently';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_mirror_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_mirror_total number of mirror calls';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_translate_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_translate_total number of translate calls';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_query_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_query_total number of /query requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_type_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_type_total number of /type requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_id_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_id_total number of /id requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_slug_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_slug_total number of /slug requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_action_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_action_total number of /action requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_whoami_query_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_whoami_query_total number of /whoami requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_mirror_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_mirror_duration_seconds histogram of durations taken to make mirror calls in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_translate_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_translate_duration_seconds histogram of durations taken to run translate calls in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_query_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_query_duration_seconds histogram of durations taken to process /query requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_type_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_type_duration_seconds histogram of durations taken to process /type requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_id_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_id_duration_seconds histogram of durations taken to process /id requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_slug_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_slug_duration_seconds histogram of durations taken to process /slug requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_action_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_action_duration_seconds histogram of durations taken to process /action requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_whoami_query_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_whoami_query_duration_seconds histogram of durations ' +
		'taken to process /whoami requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_job_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_worker_job_duration_seconds histogram of durations taken to complete worker jobs in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_mirror_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_mirror_failure_total number of mirror call failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_query_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_query_failure_total number of /query request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_type_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_type_failure_total number of /type request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_id_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_id_failure_total number of /id request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_slug_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_slug_failure_total number of /slug request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_action_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_api_action_failure_total number of /action request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_whoami_query_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc =
		'# HELP jf_http_whoami_query_failure_total number of /whoami request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});
