/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { defaultEnvironment } from '@balena/jellyfish-environment';
import { get, IncomingMessage } from 'http';
import { noop } from 'lodash';
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

let context: any = {}
beforeAll(async () => {
	// Set up context
	context = {
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
		func: noop,
		failFunc: () => {
			throw new Error('test')
		},
		actor: '',
	};
	context.actor = actorFromContext(context.context);
	context.cardPatchFunc = async () => {
		return context.card;
	};

	// Start metrics server
	startServer(context.context, defaultEnvironment.metrics.ports.app);

	// Trigger initial metrics data
	markCardInsert(context.card);
	markCardUpsert(context.card);
	markCardReadFromDatabase(context.card);
	markCardReadFromCache(context.card);
	markBackSync(context.integration);
	markActionRequest(context.action);
	markJobAdd(context.action, context.context.id);
	markJobDone(context.action, context.context.id, new Date().toISOString());
	markSqlGenTime(context.milliseconds);
	markQueryTime(context.milliseconds);
	markStreamOpened(context.context, context.table);
	markStreamLinkQuery(context.context, context.table, context.change);
	markStreamError(context.context, context.table);
	markQueueConcurrency();
	await measureMirror(context.integration, context.func);
	await measureTranslate(context.integration, context.func);
	await measureHttpQuery(context.func);
	await measureHttpType(context.func);
	await measureHttpId(context.func);
	await measureHttpSlug(context.func);
	await measureHttpAction(context.func);
	await measureHttpWhoami(context.func);
	await measureCardPatch(context.cardPatchFunc);

	// Failure counters
	await test.throwsAsync(measureMirror(context.integration, context.failFunc));
	await test.throwsAsync(measureTranslate(context.integration, context.failFunc));
	await test.throwsAsync(measureHttpQuery(context.failFunc));
	await test.throwsAsync(measureHttpType(context.failFunc));
	await test.throwsAsync(measureHttpId(context.failFunc));
	await test.throwsAsync(measureHttpSlug(context.failFunc));
	await test.throwsAsync(measureHttpAction(context.failFunc));
	await test.throwsAsync(measureHttpWhoami(context.failFunc));
	await test.throwsAsync(measureCardPatch(context.failFunc));
})

async function getMetrics(): Promise<{ code: number | undefined, body: string }> {
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
			})

			res.on('end', () => {
				return resolve({
					code: res.statusCode,
					body: data,
				})
			})
		})

		req.on('error', (err: Error) => {
			return reject(new Error(`${err}`));
		})

		req.end();
	})
}

test('actorFromContext() should return actor name', () => {
	const actor = actorFromContext(context.context);
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
	expect(result.body.includes(`jf_card_insert_total{type="${context.cardType}"} 1`)).toBeTruthy();

	markCardInsert(context.card);
	result = await getMetrics();
	expect(result.body.includes(`jf_card_insert_total{type="${context.cardType}"} 2`)).toBeTruthy();
});

test('.markCardUpsert() should increment the card upsert counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_card_upsert_total{type="${context.cardType}"} 1`)).toBeTruthy();

	markCardUpsert(context.card);
	result = await getMetrics();
	expect(result.body.includes(`jf_card_upsert_total{type="${context.cardType}"} 2`)).toBeTruthy();
});

test('.markCardReadFromDatabase() should increment the card read from database counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_card_read_total{type="${context.cardType}",source="database"} 1`)).toBeTruthy();

	markCardReadFromDatabase(context.card);
	result = await getMetrics();
	expect(result.body.includes(`jf_card_read_total{type="${context.cardType}",source="database"} 2`)).toBeTruthy();
});

test('.markCardReadFromCache() should increment the card read from cache counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_card_read_total{type="${context.cardType}",source="cache"} 1`)).toBeTruthy();

	markCardReadFromCache(context.card);
	result = await getMetrics();
	expect(result.body.includes(`jf_card_read_total{type="${context.cardType}",source="cache"} 2`)).toBeTruthy();
});

test('.markBackSync() should increment the back sync counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_back_sync_total{type="${context.integration}"} 1`)).toBeTruthy();

	markBackSync(context.integration);
	result = await getMetrics();
	expect(result.body.includes(`jf_back_sync_total{type="${context.integration}"} 2`)).toBeTruthy();
});

test('.markActionRequest() should increment the action request counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_worker_action_request_total{type="${context.action}"} 1`)).toBeTruthy();

	markActionRequest(context.action);
	result = await getMetrics();
	expect(result.body.includes(`jf_worker_action_request_total{type="${context.action}"} 2`)).toBeTruthy();
});

test('.markJobAdd() and .markJobDone() should increment and decrement the worker saturation gauge', async () => {
	markJobAdd(context.action, context.context.id);
	let result = await getMetrics();
	expect(result.body.includes(`jf_worker_saturation{type="${context.action}",worker="${context.context.id}"} 1`)).toBeTruthy();

	markJobDone(context.action, context.context.id, new Date().toISOString());
	result = await getMetrics();
	expect(result.body.includes(`jf_worker_saturation{type="${context.action}",worker="${context.context.id}"} 0`)).toBeTruthy();
});

test('.markSqlGenTime() should update SQL query generation time metrics', async () => {
	let result = await getMetrics();
	expect(result.body.includes('jf_sql_gen_duration_seconds_bucket{le="1.024"} 1')).toBeTruthy();
	expect(result.body.includes('jf_sql_gen_duration_seconds_sum 1')).toBeTruthy();
	expect(result.body.includes('jf_sql_gen_duration_seconds_count 1')).toBeTruthy();

	markSqlGenTime(context.milliseconds);
	result = await getMetrics();
	expect(result.body.includes('jf_sql_gen_duration_seconds_bucket{le="1.024"} 2')).toBeTruthy();
	expect(result.body.includes('jf_sql_gen_duration_seconds_sum 2')).toBeTruthy();
	expect(result.body.includes('jf_sql_gen_duration_seconds_count 2')).toBeTruthy();
});

test('.markQueryTime() should update SQL query execution time metrics', async () => {
	let result = await getMetrics();
	expect(result.body.includes('jf_query_duration_seconds_bucket{le="1.024"} 1')).toBeTruthy();
	expect(result.body.includes('jf_query_duration_seconds_sum 1')).toBeTruthy();
	expect(result.body.includes('jf_query_duration_seconds_count 1')).toBeTruthy();

	markQueryTime(context.milliseconds);
	result = await getMetrics();
	expect(result.body.includes('jf_query_duration_seconds_count 2')).toBeTruthy();
	expect(result.body.includes('jf_query_duration_seconds_sum 2')).toBeTruthy();
	expect(result.body.includes('jf_query_duration_seconds_count 2')).toBeTruthy();
});

test('.markStreamOpened() and .markStreamClosed() should increment and decrement the stream saturation gauge', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_streams_saturation{actor="${context.actor}",table="${context.table}"} 1`)).toBeTruthy();

	markStreamClosed(context.context, context.table);
	result = await getMetrics();
	expect(result.body.includes(`jf_streams_saturation{actor="${context.actor}",table="${context.table}"} 0`)).toBeTruthy();
});

test('.markStreamLinkQuery() should increment the stream link query counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_streams_link_query_total{table="${context.table}",actor="${context.actor}",` +
	`type="${context.change.type}",card="${context.cardType}"} 1`)).toBeTruthy();

	markStreamLinkQuery(context.context, context.table, context.change);
	result = await getMetrics();
	expect(result.body.includes(`jf_streams_link_query_total{table="${context.table}",actor="${context.actor}",` +
	`type="${context.change.type}",card="${context.cardType}"} 2`)).toBeTruthy();
});

test('.markStreamError() should increment the stream error counter', async () => {
	let result = await getMetrics();
	expect(result.body.includes(`jf_streams_error_total{actor="${context.actor}",table="${context.table}"} 1`)).toBeTruthy();

	markStreamError(context.context, context.table);
	result = await getMetrics();
	expect(result.body.includes(`jf_streams_error_total{actor="${context.actor}",table="${context.table}"} 2`)).toBeTruthy();
});

test('.markQueueConcurrency() should expose the queue concurrency setting', async () => {
	const result = await getMetrics();
	expect(result.body.includes(`jf_worker_concurrency ${defaultEnvironment.queue.concurrency}`)).toBeTruthy();
});

test('.measureMirror() should increment counters', async () => {
	const result = await getMetrics();
	expect(new RegExp(`jf_mirror_total{type="${context.integration}"} 2`).test(result.body)).toBeTruthy();
	expect(new RegExp(`jf_mirror_duration_seconds_count{type="${context.integration}"} 1`).test(result.body)).toBeTruthy();
	expect(new RegExp(`jf_mirror_failure_total{type="${context.integration}"} 1`).test(result.body)).toBeTruthy();
});

test('.measureTranslate() should increment counters', async () => {
	const result = await getMetrics();
	expect(new RegExp(`jf_translate_total{type="${context.integration}"} 2`).test(result.body)).toBeTruthy();
	expect(new RegExp(`jf_translate_duration_seconds_count{type="${context.integration}"} 1`).test(result.body)).toBeTruthy();
	expect(new RegExp(`jf_translate_failure_total{type="${context.integration}"} 1`).test(result.body)).toBeTruthy();
});

test('.measureHttpQuery() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_query_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_query_failure_total 1')).toBeTruthy();
	expect(result.body.includes('jf_http_api_query_duration_seconds_count 1')).toBeTruthy();
})

test('.measureHttpType() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_type_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_type_failure_total 1')).toBeTruthy();
	expect(result.body.includes('jf_http_api_type_duration_seconds_count 1')).toBeTruthy();
});

test('.measureHttpId() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_id_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_id_failure_total 1')).toBeTruthy()
	expect(result.body.includes('jf_http_api_id_duration_seconds_count 1')).toBeTruthy();
});

test('.measureHttpSlug() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_slug_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_slug_failure_total 1')).toBeTruthy();
	expect(result.body.includes('jf_http_api_slug_duration_seconds_count 1')).toBeTruthy();
});

test('.measureHttpAction() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_http_api_action_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_api_action_failure_total 1')).toBeTruthy();
	expect(result.body.includes('jf_http_api_action_duration_seconds_count 1')).toBeTruthy();
});

test('.measureHttpWhoami() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_http_whoami_query_total 2')).toBeTruthy();
	expect(result.body.includes('jf_http_whoami_query_failure_total 1')).toBeTruthy();
	expect(result.body.includes('jf_http_whoami_query_duration_seconds_count 1')).toBeTruthy();
});

test('.measureCardPatch() should increment counters', async () => {
	const result = await getMetrics();
	expect(result.body.includes('jf_card_patch_total 2')).toBeTruthy();
	expect(result.body.includes('jf_card_patch_failure_total 1')).toBeTruthy();
	expect(result.body.includes(`jf_card_patch_duration_seconds_count{type="${context.cardType}"} 1`)).toBeTruthy();
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
	const desc = '# HELP jf_card_patch_failure_total number of card patch failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_card_read_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_card_read_total number of cards read from database/cache';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_back_sync_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_back_sync_total number of back syncs';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_action_request_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_worker_action_request_total number of received action requests';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_saturation has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_worker_saturation number of jobs being processed in worker queues';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_sql_gen_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_sql_gen_duration_seconds histogram of durations taken to generate sql with jsonschema2sql';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_query_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_query_duration_seconds histogram of durations taken to query the database';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_streams_saturation has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_streams_saturation number of streams open';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_streams_link_query_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_streams_link_query_total number of times streams query links';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_streams_error_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_streams_error_total number of stream errors';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_concurrency has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_worker_concurrency number of jobs worker queues can process concurrently';
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
	const desc = '# HELP jf_mirror_duration_seconds histogram of durations taken to make mirror calls in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_translate_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_translate_duration_seconds histogram of durations taken to run translate calls in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_query_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_query_duration_seconds histogram of durations taken to process /query requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_type_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_type_duration_seconds histogram of durations taken to process /type requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_id_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_id_duration_seconds histogram of durations taken to process /id requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_slug_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_slug_duration_seconds histogram of durations taken to process /slug requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_action_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_action_duration_seconds histogram of durations taken to process /action requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_whoami_query_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_whoami_query_duration_seconds histogram of durations ' +
		'taken to process /whoami requests in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_worker_job_duration_seconds has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_worker_job_duration_seconds histogram of durations taken to complete worker jobs in seconds';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_mirror_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_mirror_failure_total number of mirror call failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_query_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_query_failure_total number of /query request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_type_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_type_failure_total number of /type request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_id_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_id_failure_total number of /id request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_slug_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_slug_failure_total number of /slug request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_api_action_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_api_action_failure_total number of /action request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});

test('jf_http_whoami_query_failure_total has a description', async () => {
	const result = await getMetrics();
	const desc = '# HELP jf_http_whoami_query_failure_total number of /whoami request failures';
	expect(result.body.includes(desc)).toBeTruthy();
});
