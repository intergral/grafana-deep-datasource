/*
 *    Copyright 2023 Intergral GmbH
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

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
  tpQueryType?: DeepTracepointQueryType;
  tpCreate: DeepTracepointCreateConfig;
}

export const DEFAULT_FIRE_COUNT = 1;

export interface DeepTracepointCreateConfig {
  targeting?: string;
  path: string;
  line_number: number;
  fire_count: number;
  watches: string[];
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
export interface DeepDatasourceOptions extends DataSourceJsonData {
  experimental: { deepql: boolean };
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}

export interface SnapshotTableData {
  [key: string]: string | number | boolean | undefined; // dynamic attribute name
  snapshotID?: string;
  startTime?: string;
  name?: string;
  durationNano?: string;
}

export type DeepQueryType = 'deepql' | 'search' | 'byid' | 'tracepoint';
export type DeepTracepointQueryType = 'list' | 'create' | 'delete';
