/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

import { Contract } from '@balena/jellyfish-types/build/core';

/**
 * Common metric definition
 */
export interface Metric {
	name: string;
	description: string;
}

/**
 * Histogram metric definition
 */
export interface Histogram extends Metric {
	buckets: number[];
}

/**
 * List of possible parts used to construct metric names
 */
export interface MetricName {
	total: string;
	saturation: string;
	jobDuration: string;
	concurrency: string;
	durationSeconds: string;
	failureTotal: string;
	errorTotal: string;
}

/**
 * Card operation metric names
 */
export interface CardMetricNames extends Pick<MetricName, 'total'> {}

/**
 * Worker metric names
 */
export interface WorkerMetricNames
	extends Pick<
		MetricName,
		'total' | 'saturation' | 'jobDuration' | 'concurrency'
	> {}

/**
 * Back sync operation metric names
 */
export interface BackSyncMetricNames extends Pick<MetricName, 'total'> {}

/**
 * SQL operation metric names
 */
export interface SQLMetricNames extends Pick<MetricName, 'durationSeconds'> {}

/**
 * Stream operation metric names
 */
export interface StreamMetricNames
	extends Pick<MetricName, 'total' | 'saturation' | 'errorTotal'> {}

/**
 * Common async measure metric names
 */
export interface MeasureMetricNames
	extends Pick<MetricName, 'total' | 'durationSeconds' | 'failureTotal'> {}

/**
 * Definition of full list of metric names
 */
export interface MetricNames {
	card: {
		upsert: CardMetricNames;
		insert: CardMetricNames;
		read: CardMetricNames;
		patch: MeasureMetricNames;
	};
	worker: WorkerMetricNames;
	backSync: BackSyncMetricNames;
	sql: {
		gen: SQLMetricNames;
		query: SQLMetricNames;
	};
	streams: StreamMetricNames;
	mirror: MeasureMetricNames;
	translate: MeasureMetricNames;
	http: {
		query: MeasureMetricNames;
		type: MeasureMetricNames;
		id: MeasureMetricNames;
		slug: MeasureMetricNames;
		action: MeasureMetricNames;
		whoami: MeasureMetricNames;
	};
}

export interface StreamChange {
	type: string;
	before: Contract;
	after: Contract;
}

// TS-TODO: Replace with proper Context type
export interface Context {
	id: string;
	[key: string]: any;
}
