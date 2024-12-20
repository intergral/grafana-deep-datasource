/*
 * Copyright (C) 2024  Intergral GmbH
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

import { CoreApp, DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import {
  BackendSrvRequest,
  config,
  DataSourceWithBackend,
  getBackendSrv,
  getTemplateSrv,
  reportInteraction,
  TemplateSrv,
} from '@grafana/runtime';

import { DeepDatasourceOptions, DeepQuery, DEFAULT_FIRE_COUNT, DEFAULT_QUERY, SearchQueryParams } from './types';
import DeepLanguageProvider from './deepql/DeepLanguageProvider';
import { catchError, lastValueFrom, map, merge, Observable, of } from 'rxjs';
import { serializeParams } from 'Utils';
import { groupBy, identity, pick, pickBy } from 'lodash';
import { transformSearchResult, transformSnapshot, transformTracepoint } from 'ResultTransformer';

export const DEFAULT_LIMIT = 20;

export class DeepDataSource extends DataSourceWithBackend<DeepQuery, DeepDatasourceOptions> {
  languageProvider: DeepLanguageProvider;

  constructor(
    private instanceSettings: DataSourceInstanceSettings<DeepDatasourceOptions>,
    private readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super(instanceSettings);
    this.languageProvider = new DeepLanguageProvider(this);
  }

  getDatasourceOptions(): DeepDatasourceOptions {
    return this.instanceSettings.jsonData;
  }

  getDefaultQuery(_: CoreApp): Partial<DeepQuery> {
    return DEFAULT_QUERY;
  }

  query(options: DataQueryRequest<DeepQuery>): Observable<DataQueryResponse> {
    const filteredTargets = options.targets.filter((value) => !value.hide);
    const targets: { [type: string]: DeepQuery[] } = groupBy(filteredTargets, (t) => t.queryType || 'deepql');
    const queries: Array<Observable<DataQueryResponse>> = [];
    if (targets.search?.length) {
      const deepQuery = targets.search[0];
      try {
        reportInteraction('grafana_snapshot_search_queried', {
          datasourceType: 'deep',
          app: options.app ?? '',
          grafana_version: config.buildInfo.version,
          hasServiceName: !!deepQuery.serviceName,
          resultLimit: deepQuery.limit ?? '',
          hasSearch: !!deepQuery.search,
        });

        const timeRange = { startTime: options.range.from.unix(), endTime: options.range.to.unix() };
        const query = this.applyVariables(deepQuery, options.scopedVars);
        const searchQuery = this.buildSearchQuery(query, timeRange);
        queries.push(
          this._request('/api/search', searchQuery).pipe(
            map((response) => {
              return transformSearchResult(response.data.snapshots, this.instanceSettings);
            }),
            catchError((error) => {
              return of({ error: { message: error.data.message }, data: [] });
            })
          )
        );
      } catch (error) {
        return of({
          error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
          data: [],
        });
      }
    }

    if (targets.tracepoint?.length) {
      try {
        const appliedQuery = this.applyVariables(targets.tracepoint[0], options.scopedVars);
        const queryValue = appliedQuery?.query || '';
        reportInteraction('grafana_traces_tracepoints_queried', {
          datasourceType: 'deep',
          app: options.app ?? '',
          grafana_version: config.buildInfo.version,
          hasQuery: queryValue !== '',
        });

        queries.push(this.handleTracepointQuery(options, appliedQuery));
      } catch (error) {
        return of({
          error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
          data: [],
        });
      }
    }

    if (targets.byid?.length) {
      try {
        const appliedQuery = this.applyVariables(targets.byid[0], options.scopedVars);
        const queryValue = appliedQuery?.query || '';
        // Check whether this is a snapshot ID or deepQL query by checking if it only contains hex characters
        // There's only hex characters so let's assume that this is a trace ID
        reportInteraction('grafana_traces_snapshotID_queried', {
          datasourceType: 'deep',
          app: options.app ?? '',
          grafana_version: config.buildInfo.version,
          hasQuery: queryValue !== '',
        });

        queries.push(this.handleSingleRequest(options, appliedQuery));
      } catch (error) {
        return of({
          error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
          data: [],
        });
      }
    }
    if (targets.deepql?.length) {
      try {
        const appliedQuery = this.applyVariables(targets.deepql[0], options.scopedVars);
        const queryValue = appliedQuery?.query || '';
        const hexOnlyRegex = /^[0-9A-Fa-f]*$/;
        // Check whether this is a snapshot ID or deepQL query by checking if it only contains hex characters
        if (queryValue.trim().match(hexOnlyRegex)) {
          // There's only hex characters so let's assume that this is a trace ID
          reportInteraction('grafana_traces_snapshotID_queried', {
            datasourceType: 'deep',
            app: options.app ?? '',
            grafana_version: config.buildInfo.version,
            hasQuery: queryValue !== '',
          });

          queries.push(this.handleSingleRequest(options, { ...appliedQuery, queryType: 'byid' }));
        } else {
          reportInteraction('grafana_traces_deepql_queried', {
            datasourceType: 'deep',
            app: options.app ?? '',
            grafana_version: config.buildInfo.version,
            query: queryValue ?? '',
          });
          queries.push(
            this.handleDeepQlRequest(options, {
              ...appliedQuery,
              query: queryValue,
              limit: appliedQuery.limit || DEFAULT_LIMIT,
            })
          );
        }
      } catch (error) {
        return of({
          error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
          data: [],
        });
      }
    }

    return merge(...queries);
  }

  buildSearchQuery(query: DeepQuery, timeRange?: { startTime: number; endTime?: number }): SearchQueryParams {
    let tags = query.search ?? '';

    let deepQuery = pick(query, ['limit']);
    // Remove empty properties
    deepQuery = pickBy(deepQuery, identity);

    if (query.serviceName) {
      tags += `service.name="${query.serviceName}"`;
    }

    // Set default limit
    if (!deepQuery.limit) {
      deepQuery.limit = DEFAULT_LIMIT;
    }

    if (!Number.isInteger(deepQuery.limit) || deepQuery.limit <= 0) {
      throw new Error('Please enter a valid limit.');
    }

    let searchQuery: SearchQueryParams = { tags, ...deepQuery };

    if (timeRange) {
      searchQuery.start = timeRange.startTime;
      searchQuery.end = timeRange.endTime;
    }

    return searchQuery;
  }

  applyVariables(query: DeepQuery, scopedVars: ScopedVars) {
    const expandedQuery = { ...query };

    return {
      ...expandedQuery,
      query: this.templateSrv.replace(query.query ?? '', scopedVars),
      serviceName: this.templateSrv.replace(query.serviceName ?? '', scopedVars),
      search: this.templateSrv.replace(query.search ?? '', scopedVars),
    };
  }

  async metadataRequest(url: string, params = {}) {
    return await lastValueFrom(this._request(url, params, { method: 'GET', hideFromInspector: true }));
  }

  private _request(apiUrl: string, data?: any, options?: Partial<BackendSrvRequest>): Observable<Record<string, any>> {
    const params = data ? serializeParams(data) : '';
    const url = `${this.instanceSettings.url}${apiUrl}${params.length ? `?${params}` : ''}`;
    const req = { ...options, url };

    return getBackendSrv().fetch(req);
  }

  private handleSingleRequest(options: DataQueryRequest<DeepQuery>, appliedQuery: DeepQuery) {
    const req: DataQueryRequest<DeepQuery> = {
      ...options,
      targets: [appliedQuery],
    };

    return super.query(req).pipe(
      map((response) => {
        if (response.errors?.length) {
          return response;
        }
        return transformSnapshot(response);
      })
    );
  }

  private handleTracepointQuery(options: DataQueryRequest<DeepQuery>, appliedQuery: DeepQuery) {
    const req: DataQueryRequest<DeepQuery> = {
      ...options,
      targets: [appliedQuery],
    };

    return super.query(req).pipe(
      map((response) => {
        if (response.errors?.length) {
          return response;
        }
        return transformTracepoint(response, this.instanceSettings);
      })
    );
  }

  handleCreateTracepoint(appliedQuery: DeepQuery): Observable<Record<string, any>> {
    return getBackendSrv().fetch({
      url: `${this.instanceSettings.url}/api/tracepoints`,
      method: 'post',
      data: {
        tracepoint: {
          path: appliedQuery.tpCreate.path,
          line_number: appliedQuery.tpCreate.line_number,
          args: {
            fire_count: `${appliedQuery.tpCreate.fire_count ?? DEFAULT_FIRE_COUNT}`,
            ...(appliedQuery.tpCreate.log_msg ? { log_msg: appliedQuery.tpCreate.log_msg } : {}),
            ...(appliedQuery.tpCreate.trace ? { span: appliedQuery.tpCreate.trace } : {}),
          },
          watches: (appliedQuery.tpCreate.watches ?? []).map((watch) => watch.expression),
          targeting: this.parseTargeting(appliedQuery.tpCreate.targeting),
          metrics: (appliedQuery.tpCreate?.metrics ?? []).map((metric) => {
            return {
              name: metric.name,
              expression: metric.expression,
              type: 'COUNTER',
            };
          }),
        },
      },
    });
  }

  handleDeleteTracepoint(appliedQuery: DeepQuery): Observable<Record<string, any>> {
    return this._request(`/api/tracepoints/${appliedQuery.query}`, undefined, { method: 'delete' });
  }

  private parseTargeting(targeting: string | undefined) {
    if (!targeting) {
      return [];
    }

    const kvs = [];
    const parts = targeting.split(' ');
    for (const part of parts) {
      const [key, value] = part.split('=');
      kvs.push({
        key,
        value: { stringValue: value.substring(1, value.length - 1) },
      });
    }

    return kvs;
  }

  private handleDeepQlRequest(
    options: DataQueryRequest<DeepQuery>,
    appliedQuery: DeepQuery
  ): Observable<DataQueryResponse> {
    const req: DataQueryRequest<DeepQuery> = {
      ...options,
      targets: [appliedQuery],
    };

    return super.query(req).pipe(
      map((response) => {
        if (response.errors?.length) {
          return response;
        }
        return response;
      })
    );
  }
}
