import React from 'react';
import { InlineField, RadioButtonGroup, InlineFieldRow } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DeepDataSource } from '../DeepDataSource';
import { DeepQLSearch } from './DeepQLSearch';
import { DeepQueryType, MyDataSourceOptions, DeepQuery } from '../types';
import { config, reportInteraction } from '@grafana/runtime';
import NativeSearch from './NativeSearch';

export type Props = QueryEditorProps<DeepDataSource, DeepQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, app, datasource, onBlur }: Props) {
  let queryTypeOptions: Array<SelectableValue<DeepQueryType>> = [
    { value: 'deepql', label: 'DeepQL' },
    { value: 'search', label: 'Search' },
  ];

  function onClearResults() {
    console.log('onClearResults');
  }

  if (!query.queryType) {
    query.queryType = 'deepql';
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
    </>
  );
}
