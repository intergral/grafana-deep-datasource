/*
 * Copyright (C) 2023  Intergral GmbH
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU Affero General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
  log_msg?: string;
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
  experimental: { deepql: boolean; tempo?: TempoSettings };
}

export interface TempoSettings {
  datasource: string;
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
