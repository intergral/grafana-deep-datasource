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

import React from 'react';
import { InlineField, RadioButtonGroup, InlineFieldRow } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DeepDataSource } from '../DeepDataSource';
import { DeepQLSearch } from './DeepQLSearch';
import { DeepQueryType, DeepDatasourceOptions, DeepQuery } from '../types';
import { config, reportInteraction } from '@grafana/runtime';
import NativeSearch from './NativeSearch';
import { FindByIDSearch } from './FindByIDSearch';
import { TracepointSearch } from './tracepoints/TracepointSearch';

export type Props = QueryEditorProps<DeepDataSource, DeepQuery, DeepDatasourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, app, datasource, onBlur }: Props) {
  let queryTypeOptions: Array<SelectableValue<DeepQueryType>> = [
    { value: 'byid', label: 'Find ID' },
    { value: 'search', label: 'Search' },
    { value: 'tracepoint', label: 'Tracepoints' },
  ];

  if (datasource.getDatasourceOptions().experimental?.deepql) {
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
      {query.queryType === 'tracepoint' && (
        <TracepointSearch
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
