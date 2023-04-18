import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface DeepQuery extends DataQuery {
  limit?: number;
  search: string;
  serviceName?: string;
  /**
   * TraceQL query or trace ID
   */
  query: string;

  queryType: DeepQueryType;
}

export interface SearchQueryParams {
  limit?: number;
  tags?: string;
  start?: number;
  end?: number;
}

export type SnapshotSearchMetadata = {
  snapshotID: string;
  serviceName: string;
  filePath: string;
  lineNo: number;
  startTimeUnixNano?: string;
  durationNano?: string;
};

export const DEFAULT_QUERY: Partial<DeepQuery> = {};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}

export interface Snapshot {
  ID: string;
  attributes: Array<{ key: string }>;
}

export interface SnapshotTableData {
  [key: string]: string | number | boolean | undefined; // dynamic attribute name
  snapshotID?: string;
  startTime?: string;
  name?: string;
  durationNano?: string;
}

export type DeepQueryType = 'deepql' | 'search';
