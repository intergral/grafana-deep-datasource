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
import { InlineField, RadioButtonGroup } from '@grafana/ui';
import { Props } from '../QueryEditor';
import { DeepTracepointQueryType } from '../../types';
import { config, reportInteraction } from '@grafana/runtime';
import { SelectableValue } from '@grafana/data';
import { TracepointList } from './TracepointList';
import { TracepointDelete } from './TracepointDelete';
import { TracepointCreate } from './TracepointCreate';

export const TracepointSearch = ({ datasource, query, onChange, onRunQuery, app }: Props) => {
  let queryTypeOptions: Array<SelectableValue<DeepTracepointQueryType>> = [
    { value: 'list', label: 'List Tracepoints' },
    { value: 'create', label: 'Create Tracepoint' },
    { value: 'delete', label: 'Delete Tracepoint' },
  ];

  if (!query.tpQueryType) {
    query.tpQueryType = 'list';
  }

  return (
    <>
      <InlineField label="Tracepoint Action">
        <RadioButtonGroup<DeepTracepointQueryType>
          options={queryTypeOptions}
          value={query.tpQueryType}
          onChange={(v) => {
            reportInteraction('grafana_snapshot_query_type_changed', {
              datasourceType: 'deep',
              app: app ?? '',
              grafana_version: config.buildInfo.version,
              newTpQueryType: v,
              previousTpQueryType: query.tpQueryType ?? '',
            });

            onChange({
              ...query,
              tpQueryType: v,
            });
          }}
          size="md"
        />
      </InlineField>
      {query.tpQueryType === 'list' && (
        <TracepointList query={query} onChange={onChange} onRunQuery={onRunQuery} datasource={datasource} />
      )}
      {query.tpQueryType === 'delete' && (
        <TracepointDelete datasource={datasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />
      )}
      {query.tpQueryType === 'create' && (
        <TracepointCreate datasource={datasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />
      )}
    </>
  );
};
