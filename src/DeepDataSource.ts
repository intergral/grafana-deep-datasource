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

import { DeepQuery, DEFAULT_QUERY, DeepDatasourceOptions, SearchQueryParams } from './types';
import DeepLanguageProvider from './DeepLanguageProvider';
import { catchError, lastValueFrom, map, merge, Observable, of } from 'rxjs';
import { serializeParams } from 'Utils';
import { groupBy, identity, pick, pickBy } from 'lodash';
import { createTableFrameFromSearch, createTableFrameFromTraceQlQuery, transformSnapshot } from 'ResultTransformer';

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
        reportInteraction('grafana_traces_search_queried', {
          datasourceType: 'tempo',
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
              return {
                data: [createTableFrameFromSearch(response.data.snapshots, this.instanceSettings)],
              };
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

          queries.push(this.handleSingleRequest(options, appliedQuery));
        } else {
          reportInteraction('grafana_traces_deepql_queried', {
            datasourceType: 'deep',
            app: options.app ?? '',
            grafana_version: config.buildInfo.version,
            query: queryValue ?? '',
          });
          queries.push(
            this._request('/api/search', {
              q: queryValue,
              limit: options.targets[0].limit ?? DEFAULT_LIMIT,
              start: options.range.from.unix(),
              end: options.range.to.unix(),
            }).pipe(
              map((response) => {
                return {
                  data: createTableFrameFromTraceQlQuery(response.data.traces, this.instanceSettings),
                };
              }),
              catchError((error) => {
                return of({ error: { message: error.data.message }, data: [] });
              })
            )
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

    let tempoQuery = pick(query, ['limit']);
    // Remove empty properties
    tempoQuery = pickBy(tempoQuery, identity);

    if (query.serviceName) {
      tags += ` service.name="${query.serviceName}"`;
    }

    // Set default limit
    if (!tempoQuery.limit) {
      tempoQuery.limit = DEFAULT_LIMIT;
    }

    if (!Number.isInteger(tempoQuery.limit) || tempoQuery.limit <= 0) {
      throw new Error('Please enter a valid limit.');
    }

    let searchQuery: SearchQueryParams = { tags, ...tempoQuery };

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
        if (response.error) {
          return response;
        }
        return transformSnapshot(response);
      })
    );
  }
}
