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

import { DeepDatasourceOptions, SnapshotSearchMetadata, SnapshotTableData } from './types';
import { DataFrame, DataQueryResponse, DataSourceInstanceSettings, dateTimeFormat, FieldType } from '@grafana/data';

function addRow(frame: DataFrame, ...values: any[]) {
  if (values.length !== frame.fields.length) {
    throw new Error('row and field length mismatch');
  }
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    frame.fields[i].values.push(value);
  }
  frame.length += 1;
}

export function createTableFrameFromSearch(
  data: SnapshotSearchMetadata[],
  instanceSettings: DataSourceInstanceSettings<DeepDatasourceOptions>
) {
  const frame: DataFrame = {
    fields: [
      {
        name: 'snapshotID',
        type: FieldType.string,
        values: [],
        config: {
          unit: 'string',
          displayNameFromDS: 'Snapshot ID',
          links: [
            {
              title: 'Snapshot: ${__value.raw}',
              url: '',
              internal: {
                datasourceUid: instanceSettings.uid,
                datasourceName: instanceSettings.name,
                query: {
                  query: '${__value.raw}',
                  queryType: 'byid',
                },
              },
            },
          ],
        },
      },
      { name: 'location', values: [], type: FieldType.string, config: { displayNameFromDS: 'Snapshot Location' } },
      { name: 'startTime', values: [], type: FieldType.string, config: { displayNameFromDS: 'Start time' } },
      { name: 'duration', values: [], type: FieldType.number, config: { displayNameFromDS: 'Duration', unit: 'ns' } },
    ],
    meta: {
      preferredVisualisationType: 'table',
    },
    length: 0,
  };
  if (!data?.length) {
    return frame;
  }
  // Show the most recent traces
  const traceData = data
    .sort((a, b) => parseInt(b?.startTimeUnixNano!, 10) / 1000000 - parseInt(a?.startTimeUnixNano!, 10) / 1000000)
    .map(transformToTraceData);

  for (const row of traceData) {
    addRow(frame, row.snapshotID, row.location, row.startTime, row.durationNano);
  }

  return frame;
}

function transformToTraceData(data: SnapshotSearchMetadata): SnapshotTableData {
  let location = '';
  if (data.serviceName) {
    location += data.serviceName + ' ';
  }
  if (data.filePath) {
    location += data.filePath;
  }
  if (data.lineNo) {
    location += ':' + data.lineNo;
  }

  const traceStartTime = parseInt(data.startTimeUnixNano!, 10) / 1000000;

  let startTime = !isNaN(traceStartTime) ? dateTimeFormat(traceStartTime) : '';

  return {
    snapshotID: data.snapshotID,
    startTime,
    durationNano: data.durationNano?.toString(),
    location,
  };
}

export function transformSnapshot(response: DataQueryResponse): DataQueryResponse {
  return response;
}

export function transformTracepoint(
  response: DataQueryResponse,
  instanceSettings: DataSourceInstanceSettings<DeepDatasourceOptions>
): DataQueryResponse {
  response.data[0].fields[0].config = {
    unit: 'string',
    displayNameFromDS: 'Tracepoint ID',
    links: [
      {
        title: 'View: ${__value.raw}',
        url: '',
        internal: {
          datasourceUid: instanceSettings.uid,
          datasourceName: instanceSettings.name,
          query: {
            query: '',
            search: 'tracepoint="${__value.raw}"',
            queryType: 'search',
          },
        },
      },
    ],
  };

  response.data[0].fields.push({
    name: 'Delete',
    type: FieldType.string,
    config: {
      unit: 'string',
      displayNameFromDS: 'Delete',
      links: [
        {
          title: 'Delete: ${__value.raw}',
          url: '',
          internal: {
            datasourceUid: instanceSettings.uid,
            datasourceName: instanceSettings.name,
            query: {
              query: '${__value.raw}',
              tpQueryType: 'delete',
              queryType: 'tracepoint',
            },
          },
        },
      ],
    },
    values: [...response.data[0].fields[0].values],
  });

  return response;
}

export function transformSearchResult(
  snapshots: SnapshotSearchMetadata[],
  instanceSettings: DataSourceInstanceSettings<DeepDatasourceOptions>
): DataQueryResponse {
  return {
    data: [createTableFrameFromSearch(snapshots, instanceSettings)],
  };
}

export function transformDeepQlResponse(
  response: DataQueryResponse,
  instanceSettings: DataSourceInstanceSettings<DeepDatasourceOptions>
): DataQueryResponse {
  const responseType = response.data[0].meta.custom.type;
  if (responseType === 'byid') {
    return transformSnapshot(response);
  }

  if (responseType === 'search') {
    return response;
  }

  if (responseType === 'tracepoint') {
    return transformTracepoint(response, instanceSettings);
  }

  return response;
}
