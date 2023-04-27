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

import React from 'react';
import { InlineField, RadioButtonGroup, InlineFieldRow } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DeepDataSource } from '../DeepDataSource';
import { DeepQLSearch } from './DeepQLSearch';
import { DeepQueryType, DeepDatasourceOptions, DeepQuery } from '../types';
import { config, reportInteraction } from '@grafana/runtime';
import NativeSearch from './NativeSearch';
import { FindByIDSearch } from './FindByIDSearch';

export type Props = QueryEditorProps<DeepDataSource, DeepQuery, DeepDatasourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, app, datasource, onBlur }: Props) {
  let queryTypeOptions: Array<SelectableValue<DeepQueryType>> = [
    { value: 'byid', label: 'Find ID' },
    { value: 'search', label: 'Search' },
  ];

  if (datasource.getDatasourceOptions().experimental.deepql) {
    queryTypeOptions.push({ value: 'deepql', label: 'DeepQL' });
  }

  function onClearResults() {}

  if (!query.queryType) {
    query.queryType = 'search';
  }

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query type">
          <RadioButtonGroup<DeepQueryType>
            options={queryTypeOptions}
            value={query.queryType}
            onChange={(v) => {
              reportInteraction('grafana_snapshot_query_type_changed', {
                datasourceType: 'deep',
                app: app ?? '',
                grafana_version: config.buildInfo.version,
                newQueryType: v,
                previousQueryType: query.queryType ?? '',
              });

              onClearResults();

              onChange({
                ...query,
                queryType: v,
              });
            }}
            size="md"
          />
        </InlineField>
      </InlineFieldRow>
      {query.queryType === 'search' && (
        <NativeSearch
          datasource={datasource}
          query={query}
          onChange={onChange}
          onBlur={onBlur}
          onRunQuery={onRunQuery}
        />
      )}
      {query.queryType === 'deepql' && (
        <DeepQLSearch
          datasource={datasource}
          query={query}
          onChange={onChange}
          onBlur={onBlur}
          onRunQuery={onRunQuery}
        />
      )}
      {query.queryType === 'byid' && (
        <FindByIDSearch
          datasource={datasource}
          query={query}
          onChange={onChange}
          onBlur={onBlur}
          onRunQuery={onRunQuery}
        />
      )}
    </>
  );
}
