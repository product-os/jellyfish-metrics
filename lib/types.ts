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
 * Contract operation metric names
 */
export interface ContractMetricNames extends Pick<MetricName, 'total'> {}

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
	contract: {
		upsert: ContractMetricNames;
		insert: ContractMetricNames;
		read: ContractMetricNames;
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
	before: any;
	after: any;
}
